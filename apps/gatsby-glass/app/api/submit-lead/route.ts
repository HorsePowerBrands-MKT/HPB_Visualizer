import { NextRequest, NextResponse } from 'next/server';
import { submitLead, lookupLocationByZipcode, logApiCall } from '@repo/api-handlers/supabase';
import { pushLeadToSharpSpring } from '@repo/api-handlers/sharpspring';
import { sendSasEmail, sendRaqEmail, type SasGalleryItem } from '@repo/api-handlers/resend';
import { validateLeadData } from '@repo/api-handlers/validation';
import type { Lead, VisualizationHistoryItem, EnclosureType, TrackPreference, HardwareFinish, HandleStyle } from '@repo/types';
import { LeadSubmissionSchema } from '../../../lib/validation';
import { ZodError } from 'zod';
import { createClient } from '../../../lib/supabase/server';
import { CATALOG, GATSBY_GLASS_CONFIG } from '../../../lib/gatsby-constants/src';

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
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) authUserId = user.id;
    } catch { /* not authenticated */ }

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

    // Send the franchise-facing RAQ email (Request a Quote) to the location's
    // shared inbox so they can follow up with the customer. Falls back to the
    // brand support inbox when the customer's zip is outside any active
    // territory. Same Vercel-await rule as the SAS path above.
    if (validatedData.leadType === 'RAQ') {
      const resendApiKey = process.env.RESEND_API_KEY;
      const resendFrom = process.env.RESEND_FROM || 'Gatsby Glass <noreply@gatsbyglass.com>';

      if (!resendApiKey) {
        console.warn('[SUBMIT-LEAD] RESEND_API_KEY not configured, skipping RAQ email');
      } else {
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

            const fallbackInbox = GATSBY_GLASS_CONFIG.supportEmail || 'support@gatsbyglass.com';
            const toEmail = resolvedLocation?.email || fallbackInbox;
            const locationName = resolvedLocation?.email ? resolvedLocation.locationName : null;

            console.log(
              `[SUBMIT-LEAD] Sending RAQ email to ${toEmail} (location: ${locationName ?? 'NO_TERRITORY → fallback'}, gallery items: ${galleryItems.length})`
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

    return NextResponse.json(result);
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
