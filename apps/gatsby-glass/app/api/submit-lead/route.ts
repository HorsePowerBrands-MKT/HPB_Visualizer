import { NextRequest, NextResponse } from 'next/server';
import { submitLead, lookupLocationByZipcode, findNearestLocation, logApiCall, getTeamLocation } from '@repo/api-handlers/supabase';
import { pushLeadToSharpSpring } from '@repo/api-handlers/sharpspring';
import { sendSasEmail, sendRaqEmail, sendCustomerQuoteEmail, type SasGalleryItem } from '@repo/api-handlers/resend';
import { validateLeadData } from '@repo/api-handlers/validation';
import type { Lead, VisualizationHistoryItem, EnclosureType, TrackPreference, HardwareFinish, HandleStyle } from '@repo/types';
import { LeadSubmissionSchema } from '../../../lib/validation';
import { ZodError } from 'zod';
import { createClient } from '../../../lib/supabase/server';
import { CATALOG, GATSBY_GLASS_CONFIG, TEST_LOCATION, OUTSIDE_TERRITORY_INBOX } from '../../../lib/gatsby-constants/src';

/**
 * Build a human-readable label for a visualization history item using the
 * product catalog. Used to caption each image in the SAS email so the
 * customer can tell their generated variants apart.
 */
function buildImageLabel(viz: VisualizationHistoryItem): string {
  if (viz.mode === 'inspiration') {
    const stamp = viz.created_at
      ? new Date(viz.created_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : '';
    return stamp ? `Inspiration design · ${stamp}` : 'Inspiration design';
  }

  const parts: string[] = [];
  const enclosure = viz.enclosure_type
    ? CATALOG.enclosureTypes[viz.enclosure_type as EnclosureType]?.name
    : null;
  const framing = viz.framing_style
    ? CATALOG.trackPreferences[viz.framing_style as TrackPreference]?.name
    : null;
  const hardware = viz.hardware_finish
    ? CATALOG.hardwareFinishes[viz.hardware_finish as HardwareFinish]?.name
    : null;
  const handle = viz.handle_style
    ? CATALOG.handleStyles[viz.handle_style as HandleStyle]?.name
    : null;

  if (enclosure) parts.push(enclosure);
  if (framing) parts.push(`${framing} framing`);
  if (hardware) parts.push(`${hardware} hardware`);
  if (handle) parts.push(`${handle} handle`);

  if (parts.length === 0) {
    const stamp = viz.created_at
      ? new Date(viz.created_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : '';
    return stamp ? `Custom design · ${stamp}` : 'Custom design';
  }

  return parts.join(' · ');
}

/**
 * Map a visualization history item to the structured Enclosure/Framing/
 * Hardware/Handle fields the SAS email renders as a labeled list.
 * Returns null for inspiration mode (the email shows a different block).
 */
function buildImageConfig(viz: VisualizationHistoryItem): {
  enclosure?: string | null;
  framing?: string | null;
  hardware?: string | null;
  handle?: string | null;
} | null {
  if (viz.mode === 'inspiration') return null;
  return {
    enclosure: viz.enclosure_type
      ? CATALOG.enclosureTypes[viz.enclosure_type as EnclosureType]?.name ?? null
      : null,
    framing: viz.framing_style
      ? CATALOG.trackPreferences[viz.framing_style as TrackPreference]?.name ?? null
      : null,
    hardware: viz.hardware_finish
      ? CATALOG.hardwareFinishes[viz.hardware_finish as HardwareFinish]?.name ?? null
      : null,
    handle: viz.handle_style
      ? CATALOG.handleStyles[viz.handle_style as HandleStyle]?.name ?? null
      : null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod first
    const validatedData = LeadSubmissionSchema.parse(body);
    
    // Also use existing validation for backwards compatibility
    const validation = validateLeadData({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      zipCode: validatedData.zipCode
    });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    let authUserId: string | undefined;
    let authUserEmail: string | undefined;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) authUserId = user.id;
      if (user?.email) authUserEmail = user.email;
    } catch { /* not authenticated */ }

    if (authUserEmail) {
      const location = await getTeamLocation(
        { url: supabaseUrl, serviceKey: supabaseKey },
        authUserEmail
      );
      if (location?.userType === 'candidate') {
        return NextResponse.json(
          { error: 'Lead submission is not available for candidate accounts.' },
          { status: 403 }
        );
      }
    }

    const leadData: Lead = {
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      zipCode: validatedData.zipCode,
      visualizationImage: validatedData.visualizationImage,
      doorType: validatedData.doorType as any,
      finish: validatedData.finish as any,
      hardware: validatedData.hardware as any,
      handleStyle: validatedData.handleStyle as any,
      trackPreference: validatedData.trackPreference as any,
      mode: validatedData.mode as any,
      showerShape: validatedData.showerShape as any,
      sessionId: validatedData.sessionId,
      source: validatedData.source || 'Gatsby Glass Visualizer',
      tcpaConsent: validatedData.tcpaConsent,
      tcpaConsentText: validatedData.tcpaConsentText,
      consentIp: clientIp,
      consentUserAgent: validatedData.consentUserAgent,
      userFingerprint: validatedData.userFingerprint,
      userId: authUserId,
      leadType: validatedData.leadType,
    };

    const supabaseConfig = { url: supabaseUrl, serviceKey: supabaseKey };

    const result = await submitLead(supabaseConfig, leadData);

    logApiCall(supabaseConfig, 'lead_submission');

    // Resolve the franchise location once and share it between the
    // SharpSpring push and the RAQ email below. The lookup is cheap and
    // also runs inside `submitLead`; calling it here avoids threading the
    // resolved value out of that function.
    let resolvedLocation: { locationId: string; locationName: string; email: string | null } | null = null;
    try {
      resolvedLocation = await lookupLocationByZipcode(supabaseConfig, validatedData.zipCode);
      console.log(
        '[SUBMIT-LEAD] Resolved location:',
        resolvedLocation.locationName,
        'inbox:',
        resolvedLocation.email ?? '(none)',
        'leadType:',
        validatedData.leadType,
      );
    } catch (locErr) {
      console.error('[SUBMIT-LEAD] Location lookup failed:', locErr);
    }

    // Push to Constant Contact CRM (SharpSpring).
    // Must be awaited -- Vercel terminates the function once the response is sent,
    // so an unawaited fetch would be killed before completing.
    const ssAccountId = process.env.SHARPSPRING_ACCOUNT_ID;
    const ssSecretKey = process.env.SHARPSPRING_SECRET_KEY;

    if (ssAccountId && ssSecretKey) {
      try {
        console.log('[SUBMIT-LEAD] Starting SharpSpring push for', validatedData.email);

        const ssResult = await pushLeadToSharpSpring(
          { accountId: ssAccountId, secretKey: ssSecretKey },
          {
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone,
            zipCode: validatedData.zipCode,
            locationName: resolvedLocation?.locationName ?? 'No Territory',
            leadType: validatedData.leadType,
          },
        );

        if (!ssResult.success) {
          console.error('[SUBMIT-LEAD] SharpSpring push returned error:', ssResult.error);
        }
      } catch (ssErr) {
        console.error('[SUBMIT-LEAD] SharpSpring push failed:', ssErr);
      }
    } else {
      console.warn('[SUBMIT-LEAD] SharpSpring credentials not configured, skipping CRM push');
    }

    // Send the customer-facing SAS email (Save & Send to Me) with the
    // selected visualization as the hero plus the rest of the session's
    // history beneath it, each labeled with its configuration.
    // Must be awaited so Vercel doesn't terminate the function before the
    // request finishes (same reason as the SharpSpring push above).
    if (validatedData.leadType === 'SAS') {
      const resendApiKey = process.env.RESEND_API_KEY;
      const resendFrom = process.env.RESEND_FROM || 'Gatsby Glass <noreply@gatsbyglass.com>';

      if (!resendApiKey) {
        console.warn('[SUBMIT-LEAD] RESEND_API_KEY not configured, skipping SAS email');
      } else {
        try {
          const history = result.allVisualizationUrls ?? [];

          const heroIdx = history.findIndex(
            (v) => v.watermarked && v.watermarked === validatedData.visualizationImage
          );
          const hero =
            heroIdx >= 0
              ? history[heroIdx]
              : history.length > 0
              ? history[history.length - 1]
              : null;

          const heroImageUrl = hero?.watermarked || validatedData.visualizationImage;

          if (!heroImageUrl) {
            console.warn('[SUBMIT-LEAD] No visualization image available, skipping SAS email');
          } else {
            const heroLabel = hero
              ? buildImageLabel(hero)
              : buildImageLabel({
                  watermarked: heroImageUrl,
                  original: null,
                  created_at: new Date().toISOString(),
                  mode: (validatedData.mode as any) ?? null,
                  enclosure_type: (validatedData.doorType as any) ?? null,
                  framing_style: (validatedData.trackPreference as any) ?? null,
                  hardware_finish: (validatedData.hardware as any) ?? null,
                  handle_style: (validatedData.handleStyle as any) ?? null,
                });

            const galleryItems: SasGalleryItem[] = history
              .filter((v, i) => i !== heroIdx && !!v.watermarked)
              .reverse()
              .map((v) => ({
                imageUrl: v.watermarked as string,
                label: buildImageLabel(v),
              }));

            const firstName = validatedData.name.trim().split(/\s+/)[0] || validatedData.name.trim();

            console.log(
              `[SUBMIT-LEAD] Sending SAS email to ${validatedData.email} (gallery items: ${galleryItems.length})`
            );

            const heroConfig = hero
              ? buildImageConfig(hero)
              : buildImageConfig({
                  watermarked: heroImageUrl,
                  original: null,
                  created_at: new Date().toISOString(),
                  mode: (validatedData.mode as any) ?? null,
                  enclosure_type: (validatedData.doorType as any) ?? null,
                  framing_style: (validatedData.trackPreference as any) ?? null,
                  hardware_finish: (validatedData.hardware as any) ?? null,
                  handle_style: (validatedData.handleStyle as any) ?? null,
                });

            const emailResult = await sendSasEmail(
              {
                apiKey: resendApiKey,
                from: resendFrom,
                replyTo: GATSBY_GLASS_CONFIG.supportEmail,
              },
              {
                toEmail: validatedData.email,
                firstName,
                heroImageUrl,
                heroLabel,
                heroConfig: heroConfig ?? undefined,
                galleryItems,
                mode: validatedData.mode === 'inspiration' ? 'inspiration' : 'configure',
              }
            );

            if (!emailResult.success) {
              console.error('[SUBMIT-LEAD] SAS email send failed:', emailResult.error);
            }
          }
        } catch (emailErr) {
          // The lead is already saved; never let an email failure surface as
          // a 5xx to the user.
          console.error('[SUBMIT-LEAD] SAS email send threw:', emailErr);
        }
      }
    }

    // Territory status for a quote request: drives the franchise routing, the
    // customer confirmation variant, and the response the popup reads to show
    // an accurate on-screen message. Only meaningful for RAQ leads.
    let raqLocationMatched: boolean | undefined;
    let raqOutsideTerritory: boolean | undefined;

    // Send the franchise-facing RAQ email (Request a Quote) to the location's
    // shared inbox so they can follow up with the customer. Falls back to the
    // brand support inbox when the customer's zip is outside any active
    // territory. Same Vercel-await rule as the SAS path above.
    if (validatedData.leadType === 'RAQ') {
      const resendApiKey = process.env.RESEND_API_KEY;
      const resendFrom = process.env.RESEND_FROM || 'Gatsby Glass <noreply@gatsbyglass.com>';

      // Resolve territory status once. Computed independently of email sending
      // so the response is accurate even if Resend is unconfigured.
      //
      // QA short-circuit: a designated non-real test zip routes the RAQ email
      // to the Customer Journey QA inbox so we can exercise the pipeline
      // without spamming a real brand/franchise mailbox. Gated on a signed-in
      // session — anonymous visitors entering the test zip get the normal
      // "no territory" fallback. See `TEST_LOCATION` in gatsby-constants.
      const normalizedZip = validatedData.zipCode.replace(/[^0-9]/g, '').slice(0, 5);
      const isTestZip = normalizedZip === TEST_LOCATION.zipCode && !!authUserId;
      if (normalizedZip === TEST_LOCATION.zipCode && !authUserId) {
        console.warn(
          '[SUBMIT-LEAD] Test zip submitted by an anonymous visitor; falling back to brand inbox.'
        );
      }

      // When the zip falls inside a territory (core or buffer) we email that
      // franchise's shared inbox. Otherwise the lead still goes through but is
      // routed to the outside-territory triage inbox, enriched with the
      // nearest franchise so it can be forwarded.
      const insideTerritory = !!resolvedLocation?.email;
      const matched = isTestZip || insideTerritory;
      const outsideTerritory = !matched;
      raqLocationMatched = matched;
      raqOutsideTerritory = outsideTerritory;

      let nearest: Awaited<ReturnType<typeof findNearestLocation>> = null;
      if (outsideTerritory) {
        try {
          nearest = await findNearestLocation(supabaseConfig, validatedData.zipCode);
        } catch (nearestErr) {
          console.error('[SUBMIT-LEAD] Nearest-location lookup failed:', nearestErr);
        }
      }

      const firstName =
        validatedData.name.trim().split(/\s+/)[0] || validatedData.name.trim();

      if (!resendApiKey) {
        console.warn('[SUBMIT-LEAD] RESEND_API_KEY not configured, skipping RAQ emails');
      } else {
        // Customer-facing confirmation. Best-effort; never blocks the lead.
        try {
          const customerEmailResult = await sendCustomerQuoteEmail(
            {
              apiKey: resendApiKey,
              from: resendFrom,
              replyTo: GATSBY_GLASS_CONFIG.supportEmail,
            },
            {
              toEmail: validatedData.email,
              firstName,
              matched,
              locationName: matched
                ? isTestZip
                  ? TEST_LOCATION.locationName
                  : resolvedLocation?.locationName ?? null
                : null,
              supportPhone: GATSBY_GLASS_CONFIG.supportPhone || '(866) 479-2870',
              supportPhoneTel: GATSBY_GLASS_CONFIG.supportPhoneTel || '+18664792870',
              contactUrl:
                GATSBY_GLASS_CONFIG.contactUrl || 'https://www.gatsbyglass.com/contact-us/',
            }
          );

          if (!customerEmailResult.success) {
            console.error(
              '[SUBMIT-LEAD] Customer quote email send failed:',
              customerEmailResult.error
            );
          }
        } catch (custErr) {
          console.error('[SUBMIT-LEAD] Customer quote email send threw:', custErr);
        }

        try {
          const history = result.allVisualizationUrls ?? [];

          // The hero is the image the customer was viewing when they clicked
          // "Request a Quote". Match on the watermarked URL the form posted.
          const heroIdx = history.findIndex(
            (v) => v.watermarked && v.watermarked === validatedData.visualizationImage
          );
          const hero =
            heroIdx >= 0
              ? history[heroIdx]
              : history.length > 0
              ? history[history.length - 1]
              : null;

          const heroImageUrl = hero?.watermarked || validatedData.visualizationImage;

          if (!heroImageUrl) {
            console.warn('[SUBMIT-LEAD] No visualization image available, skipping RAQ email');
          } else {
            const heroLabel = hero
              ? buildImageLabel(hero)
              : buildImageLabel({
                  watermarked: heroImageUrl,
                  original: null,
                  created_at: new Date().toISOString(),
                  mode: (validatedData.mode as any) ?? null,
                  enclosure_type: (validatedData.doorType as any) ?? null,
                  framing_style: (validatedData.trackPreference as any) ?? null,
                  hardware_finish: (validatedData.hardware as any) ?? null,
                  handle_style: (validatedData.handleStyle as any) ?? null,
                });

            // Newest-first reads better in a follow-up notification because
            // the most recent designs are most representative of intent.
            const galleryItems: SasGalleryItem[] = history
              .filter((v, i) => i !== heroIdx && !!v.watermarked)
              .slice()
              .reverse()
              .map((v) => ({
                imageUrl: v.watermarked as string,
                label: buildImageLabel(v),
              }));

            const toEmail = isTestZip
              ? TEST_LOCATION.email
              : insideTerritory
              ? (resolvedLocation!.email as string)
              : OUTSIDE_TERRITORY_INBOX;
            const locationName = isTestZip
              ? TEST_LOCATION.locationName
              : insideTerritory
              ? resolvedLocation!.locationName
              : null;

            console.log(
              `[SUBMIT-LEAD] Sending RAQ email to ${toEmail} (location: ${locationName ?? 'NO_TERRITORY → ' + (outsideTerritory ? 'outside-territory inbox' : 'fallback')}${isTestZip ? ' [TEST ZIP, auth user: ' + authUserId + ']' : ''}, nearest: ${nearest?.locationName ?? 'n/a'}, gallery items: ${galleryItems.length})`
            );

            const emailResult = await sendRaqEmail(
              {
                apiKey: resendApiKey,
                from: resendFrom,
                replyTo: GATSBY_GLASS_CONFIG.supportEmail,
              },
              {
                toEmail,
                locationName,
                outsideTerritory,
                nearestLocationName: nearest?.locationName ?? null,
                nearestLocationEmail: nearest?.email ?? null,
                nearestDistanceMiles: nearest?.distanceMiles ?? null,
                customerName: validatedData.name,
                customerEmail: validatedData.email,
                customerPhone: validatedData.phone || '',
                customerZipCode: validatedData.zipCode,
                submittedAt: new Date().toISOString(),
                heroImageUrl,
                heroLabel,
                galleryItems,
                mode: validatedData.mode === 'inspiration' ? 'inspiration' : 'configure',
              }
            );

            if (!emailResult.success) {
              console.error('[SUBMIT-LEAD] RAQ email send failed:', emailResult.error);
            }
          }
        } catch (emailErr) {
          console.error('[SUBMIT-LEAD] RAQ email send threw:', emailErr);
        }
      }
    }

    return NextResponse.json({
      ...result,
      ...(validatedData.leadType === 'RAQ'
        ? { locationMatched: raqLocationMatched, outsideTerritory: raqOutsideTerritory }
        : {}),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation failed', errors: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
