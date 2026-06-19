/**
 * Resend transactional email client.
 *
 * Uses the v1 REST endpoint at https://api.resend.com/emails. All calls are
 * fault-tolerant — errors are logged and returned, never thrown — so the
 * caller's main flow (lead submission) is never interrupted.
 */

export interface ResendConfig {
  apiKey: string;
  /** Verified sender, e.g. "Gatsby Glass <noreply@gatsbyglass.com>". */
  from: string;
  /** Optional reply-to address shown to the customer. */
  replyTo?: string;
}

export interface SasGalleryItem {
  imageUrl: string;
  label: string;
}

export interface SasEmailData {
  toEmail: string;
  firstName: string;
  heroImageUrl: string;
  /** Human-readable summary of the hero design. Used as the image caption
   *  and (in inspiration mode) as the configuration block body. */
  heroLabel: string;
  /** Structured configuration fields shown as a labeled list under the
   *  hero image when in `configure` mode. Each field is optional; missing
   *  fields are omitted from the rendered list. */
  heroConfig?: {
    enclosure?: string | null;
    framing?: string | null;
    hardware?: string | null;
    handle?: string | null;
  };
  galleryItems: SasGalleryItem[];
  mode: 'configure' | 'inspiration';
  /** Public marketing/landing site URL (used in the Estimate CTA). */
  brandUrl?: string;
}

export interface RaqEmailData {
  /** Franchise shared inbox (or brand fallback when no territory). */
  toEmail: string;
  /** Optional CC of the brand support inbox (so HQ can monitor leads). */
  ccEmails?: string[];
  /** Resolved franchise location name, or null when no territory. */
  locationName: string | null;
  /**
   * True when the customer's zip fell outside every territory (including the
   * mileage buffer). The email then renders an "outside service area" notice
   * and surfaces the nearest franchise below so HQ can forward it.
   */
  outsideTerritory?: boolean;
  /** Closest franchise to an out-of-territory customer, if one was found. */
  nearestLocationName?: string | null;
  /** Closest franchise's shared inbox, if known. */
  nearestLocationEmail?: string | null;
  /** Approximate miles from the customer's zip to the nearest franchise. */
  nearestDistanceMiles?: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerZipCode: string;
  /** ISO timestamp the lead was submitted. */
  submittedAt: string;
  /** The image the customer was viewing when they requested the estimate. */
  heroImageUrl: string;
  /** Human-readable description of the hero image's configuration. */
  heroLabel: string;
  /** Other design previews from the same session/user, oldest or newest first
   *  per caller's preference. Each entry will be rendered as a labeled link
   *  rather than an inline image. */
  galleryItems: SasGalleryItem[];
  mode: 'configure' | 'inspiration';
  /** Public marketing/landing site URL. */
  brandUrl?: string;
}

/**
 * Customer-facing confirmation sent after a Request-a-Quote submission. Two
 * variants keyed off `matched`:
 *   - matched: their zip is served, so a local franchise was notified.
 *   - outside: their zip is outside every service area, so we point them to
 *     the support phone / contact page instead of promising a callback.
 */
export interface CustomerQuoteEmailData {
  toEmail: string;
  firstName: string;
  /** True when the zip resolved to an active franchise territory. */
  matched: boolean;
  /** Resolved franchise name, shown in the matched variant when available. */
  locationName?: string | null;
  /** Display support phone, e.g. "(866) 479-2870". */
  supportPhone: string;
  /** Dial-able support phone for tel: links, e.g. "+18664792870". */
  supportPhoneTel: string;
  /** Public contact page URL. */
  contactUrl: string;
  /** Public marketing/landing site URL. */
  brandUrl?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

const DEFAULT_BRAND_URL = 'https://www.gatsbyglass.com';
const PRIVACY_POLICY_URL = 'https://www.horsepowerbrands.com/privacy-policy';
const EMAIL_FOOTER_BORDER_IMAGE_URL =
  'https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/GG%20Email%20Border%204.png';

// Base URL the email images are served from. The logo PNG lives in this app's
// public/email-assets folder, so it resolves at the deployed site origin.
// Override with EMAIL_ASSET_BASE_URL if the asset is hosted elsewhere (e.g. a CDN).
const EMAIL_ASSET_BASE_URL = (
  process.env.EMAIL_ASSET_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  DEFAULT_BRAND_URL
).replace(/\/$/, '');
const BRAND_LOGO_URL = `${EMAIL_ASSET_BASE_URL}/email-assets/gg-logo-horizontal.png`;

// Brand header: the Gatsby Glass logo (gold wordmark + white tagline) on black.
// The PNG already has a black background that matches the header, so it blends
// seamlessly in every email client (no transparency/SVG support needed).
const BRAND_HEADER = `<tr>
                        <td align="center" style="padding:28px 30px 24px 30px; background-color:#000000; border-bottom:1px solid #231f20;">
                            <img src="${BRAND_LOGO_URL}" alt="Gatsby Glass — Raise a Glass to Sophisticated Glass Solutions" width="320" style="display:block; width:320px; max-width:80%; height:auto;">
                        </td>
                    </tr>`;

const SUBJECT_LINE = 'Your Gatsby Glass Design Preview';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHtml(data: SasEmailData): string {
  const brandUrl = data.brandUrl || DEFAULT_BRAND_URL;
  const isInspiration = data.mode === 'inspiration';

  // NOTE: The border lives on the wrapping <table>, not the <img>, because
  // Outlook (Word rendering engine) ignores `height:auto` and reserves the
  // image's *natural* pixel height — when the border is on the <img>, that
  // produces a gold frame with empty space below the scaled bitmap. Wrapping
  // the image in a bordered table cell and adding an explicit `width="540"`
  // HTML attribute keeps the frame flush against the rendered image.
  const heroSection = `
              <tr>
                <td style="padding:0 30px 4px 30px;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid #e4bf6e;">
                    <tr>
                      <td style="padding:0;font-size:0;line-height:0;">
                        <img src="${escapeHtml(data.heroImageUrl)}" alt="Your Gatsby Glass design preview" width="540" border="0"
                          style="display:block;width:100%;height:auto;border:0;outline:none;-ms-interpolation-mode:bicubic;" />
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;

  const configRow = (label: string, value: string) => `
                          <tr>
                            <td style="padding:2px 0;font-family:Arial,sans-serif;font-size:13px;color:#d5d5d5;line-height:1.7;">
                              <span style="color:#e4bf6e;font-weight:bold;letter-spacing:1px;text-transform:uppercase;font-size:11px;">${escapeHtml(label)}</span>
                              <span style="color:#5c5450;">&nbsp;&nbsp;</span>
                              ${escapeHtml(value)}
                            </td>
                          </tr>`;

  const configRows: string[] = [];
  if (data.heroConfig?.enclosure) configRows.push(configRow('Enclosure', data.heroConfig.enclosure));
  if (data.heroConfig?.framing) configRows.push(configRow('Framing', data.heroConfig.framing));
  if (data.heroConfig?.hardware) configRows.push(configRow('Hardware', data.heroConfig.hardware));
  if (data.heroConfig?.handle) configRows.push(configRow('Handle', data.heroConfig.handle));

  const configBlock = isInspiration
    ? `
              <tr>
                <td style="padding:22px 30px 0 30px;">
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background-color:#111111;border:1px solid #231f20;padding:18px;">
                        <p style="margin:0 0 8px 0;color:#e4bf6e;font-size:13px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                          Your Design
                        </p>
                        <p style="margin:0;color:#d5d5d5;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">
                          Based on your uploaded inspiration photo, tailored to your bathroom's unique layout.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
    : `
              <tr>
                <td style="padding:22px 30px 0 30px;">
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background-color:#111111;border:1px solid #231f20;padding:18px;">
                        <p style="margin:0 0 10px 0;color:#e4bf6e;font-size:13px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                          Your Selected Configuration
                        </p>
                        ${
                          configRows.length > 0
                            ? `<table role="presentation" border="0" cellspacing="0" cellpadding="0">${configRows.join('')}
                        </table>`
                            : `<p style="margin:0;color:#d5d5d5;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">${escapeHtml(data.heroLabel)}</p>`
                        }
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;

  const galleryRows = data.galleryItems.length === 0
    ? ''
    : `
              <tr>
                <td style="padding:24px 30px 8px 30px;">
                  <p style="margin:0 0 6px 0;color:#e4bf6e;font-size:13px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                    Other Previews From Your Session (${data.galleryItems.length})
                  </p>
                  <p style="margin:0 0 14px 0;color:#ababab;font-size:12px;line-height:1.6;font-family:Arial,sans-serif;">
                    Additional design variations you explored. Click any item to view the image.
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                    style="border-collapse:collapse;border:1px solid #231f20;">
                    ${data.galleryItems
                      .map(
                        (item, idx) => `
                    <tr>
                      <td style="padding:10px 14px;border-bottom:${idx === data.galleryItems.length - 1 ? '0' : '1px solid #231f20'};vertical-align:top;width:36px;color:#777777;font-size:12px;font-family:Arial,sans-serif;">
                        ${idx + 1}.
                      </td>
                      <td style="padding:10px 14px 10px 0;border-bottom:${idx === data.galleryItems.length - 1 ? '0' : '1px solid #231f20'};vertical-align:top;font-family:Arial,sans-serif;">
                        <p style="margin:0 0 4px 0;color:#ffffff;font-size:13px;line-height:1.5;">
                          ${escapeHtml(item.label)}
                        </p>
                        <a href="${escapeHtml(item.imageUrl)}" target="_blank"
                          style="color:#e4bf6e;font-size:12px;text-decoration:underline;word-break:break-all;">
                          View image
                        </a>
                      </td>
                    </tr>`
                      )
                      .join('')}
                  </table>
                </td>
              </tr>`;

  return `<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <title>${escapeHtml(SUBJECT_LINE)}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #000000;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="auto" style="background-color: #000000; margin: 0 auto; border: 1px solid #231f20; border-radius: 5px; margin: 50px; width: 600px;">
                    ${BRAND_HEADER}
                    <tr>
                        <td style="padding: 22px 30px 6px 30px; color: #ffffff; font-size: 14px; line-height: 1.7; font-family: Arial, sans-serif;">
                            <p style="margin: 0 0 8px 0;">Hi ${escapeHtml(data.firstName)},</p>
                            <p style="margin: 0;">Thank you for exploring GatsbyView. Your custom design preview is ready below for your review.</p>
                        </td>
                    </tr>
                    ${heroSection}
                    ${configBlock}
                    <tr>
                        <td style="padding: 16px 30px 0 30px; color: #777777; font-size: 12px; line-height: 1.6; font-family: Arial, sans-serif;">
                            <p style="margin: 0;">This design preview is AI-generated and intended for illustrative purposes only. Final product appearance, dimensions, and finish may vary based on site conditions, measurements, and selected materials.</p>
                        </td>
                    </tr>
                    ${galleryRows}
                    <tr>
                        <td align="center" style="padding: 24px 30px 10px 30px;">
                            <p style="margin: 0 0 10px 0; color: #e4bf6e; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; font-family: Arial, sans-serif;">
                                Ready to bring your design to life?
                            </p>
                            <p style="margin: 0 0 16px 0; color: #ababab; font-size: 12px; line-height: 1.6; font-family: Arial, sans-serif;">
                                A member of your local Gatsby Glass team can guide you through your options, take precise measurements, and provide a complimentary proposal tailored to your space.
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="background-color: #000000; border: 1px solid #e4bf6e; padding: 14px 34px;">
                                        <a href="${escapeHtml(brandUrl)}" target="_blank" style="color: #e4bf6e; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; font-family: Arial, sans-serif;">
                                            Request an Estimate
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 30px 6px 30px; color: #777777; font-size: 12px; line-height: 1.5;">
                            <p style="margin: 0;">Your design preview will remain available for 30 days.</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 14px 30px 18px 30px; color: #ababab; font-size: 12px; line-height: 1.6; font-family: Arial, sans-serif;">
                            <p style="margin: 0 0 2px 0; color: #e4bf6e; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">Gatsby Glass</p>
                            <p style="margin: 0; color: #ababab; font-style: italic; font-size: 11px; letter-spacing: 1px;">Elegant. Strong. Innovative.</p>
                            <p style="margin: 6px 0 0 0;"><a href="${escapeHtml(brandUrl)}" target="_blank" style="color: #e4bf6e; text-decoration: underline;">www.gatsbyglass.com</a></p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 30px 16px 30px; color: #777777; font-size: 11px; line-height: 1.5;">
                            <p style="margin: 0;">You are receiving this email because a shower design preview was requested for this email address. If you believe this message was sent in error, you may simply disregard it.</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 20px;">
                            <img src="${escapeHtml(EMAIL_FOOTER_BORDER_IMAGE_URL)}" alt="" width="100%" style="display: block;">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 14px; background-color: #231f20; color: #ababab; font-size: 11px; line-height: 1.6; font-family: Arial, sans-serif;">
                            &copy; Gatsby Glass &bull; A HorsePower Brands Company<br>
                            <a href="${escapeHtml(PRIVACY_POLICY_URL)}" target="_blank" style="color: #e4bf6e; text-decoration: underline;">Privacy Policy</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

</body>
</html>`;
}

function renderText(data: SasEmailData): string {
  const lines: string[] = [];
  lines.push(`Hi ${data.firstName},`);
  lines.push('');
  lines.push('Thank you for exploring GatsbyView. Your custom design preview');
  lines.push('is ready below for your review.');
  lines.push('');
  lines.push(`Design preview: ${data.heroImageUrl}`);
  lines.push('');
  lines.push('YOUR SELECTED CONFIGURATION');
  if (data.mode === 'inspiration') {
    lines.push("  Based on your uploaded inspiration photo, tailored to your");
    lines.push("  bathroom's unique layout.");
  } else if (data.heroConfig) {
    if (data.heroConfig.enclosure) lines.push(`  Enclosure: ${data.heroConfig.enclosure}`);
    if (data.heroConfig.framing) lines.push(`  Framing: ${data.heroConfig.framing}`);
    if (data.heroConfig.hardware) lines.push(`  Hardware: ${data.heroConfig.hardware}`);
    if (data.heroConfig.handle) lines.push(`  Handle: ${data.heroConfig.handle}`);
  } else {
    lines.push(`  ${data.heroLabel}`);
  }
  lines.push('');
  if (data.galleryItems.length > 0) {
    lines.push(`OTHER PREVIEWS FROM YOUR SESSION (${data.galleryItems.length})`);
    data.galleryItems.forEach((item, idx) => {
      lines.push(`  ${idx + 1}. ${item.label}`);
      lines.push(`     ${item.imageUrl}`);
    });
    lines.push('');
  }
  lines.push('This design preview is AI-generated and intended for illustrative');
  lines.push('purposes only. Final product appearance, dimensions, and finish may');
  lines.push('vary based on site conditions, measurements, and selected materials.');
  lines.push('');
  lines.push('READY TO BRING YOUR DESIGN TO LIFE?');
  lines.push('A member of your local Gatsby Glass team can guide you through');
  lines.push('your options, take precise measurements, and provide a complimentary');
  lines.push('proposal tailored to your space.');
  lines.push('');
  lines.push(`Request an estimate: ${data.brandUrl || DEFAULT_BRAND_URL}`);
  lines.push('');
  lines.push('Your design preview will remain available for 30 days.');
  lines.push('');
  lines.push('—');
  lines.push('Gatsby Glass');
  lines.push('Elegant. Strong. Innovative.');
  lines.push(data.brandUrl || DEFAULT_BRAND_URL);
  lines.push('');
  lines.push('You are receiving this email because a shower design preview was');
  lines.push('requested for this email address. If you believe this message was');
  lines.push('sent in error, you may simply disregard it.');
  return lines.join('\n');
}

/**
 * Send the "Save & Send to Me" (SAS) design preview email.
 * Returns `{ success: true }` on success, or `{ success: false, error }` on
 * failure. Never throws.
 */
export async function sendSasEmail(
  config: ResendConfig,
  data: SasEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!config.apiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }
    if (!config.from) {
      return { success: false, error: 'Resend "from" address not configured' };
    }
    if (!data.toEmail) {
      return { success: false, error: 'Recipient email is required' };
    }

    const body: Record<string, unknown> = {
      from: config.from,
      to: [data.toEmail],
      subject: SUBJECT_LINE,
      html: renderHtml(data),
      text: renderText(data),
    };

    if (config.replyTo) {
      body.reply_to = config.replyTo;
    }

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[RESEND] HTTP ${response.status}: ${text}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const json = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null;

    if (!json || !json.id) {
      console.error('[RESEND] Unexpected response shape:', JSON.stringify(json));
      return { success: false, error: 'Unexpected response from Resend' };
    }

    console.log(
      `[RESEND] SAS email queued for ${data.toEmail} (id: ${json.id}, gallery items: ${data.galleryItems.length})`
    );
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[RESEND] Unexpected error:', msg);
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Request an Estimate (RAQ) — franchise location notification
// ---------------------------------------------------------------------------

function formatRaqSubject(data: RaqEmailData): string {
  return `New Visualizer Estimate Request — ${data.customerName} (${data.customerZipCode})`;
}

function formatSubmittedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function renderRaqHtml(data: RaqEmailData): string {
  const brandUrl = data.brandUrl || DEFAULT_BRAND_URL;
  const isInspiration = data.mode === 'inspiration';
  const submittedAt = formatSubmittedAt(data.submittedAt);

  const customerInfoRows = [
    ['Name', data.customerName],
    ['Email', data.customerEmail],
    ['Phone', data.customerPhone || '—'],
    ['Zip Code', data.customerZipCode],
  ]
    .map(
      ([label, value]) => `
                      <tr>
                        <td style="padding:4px 12px 4px 0;color:#ababab;font-size:13px;font-family:Arial,sans-serif;white-space:nowrap;vertical-align:top;">
                          ${escapeHtml(label)}
                        </td>
                        <td style="padding:4px 0;color:#ffffff;font-size:13px;font-family:Arial,sans-serif;vertical-align:top;">
                          ${escapeHtml(value)}
                        </td>
                      </tr>`
    )
    .join('');

  const configBlock = isInspiration
    ? `
              <tr>
                <td style="padding:18px 30px 0 30px;">
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background-color:#111111;border:1px solid #231f20;padding:18px;">
                        <p style="margin:0 0 8px 0;color:#e4bf6e;font-size:13px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                          Design Mode
                        </p>
                        <p style="margin:0;color:#d5d5d5;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">
                          Inspiration-based (customer uploaded a reference photo).
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
    : `
              <tr>
                <td style="padding:18px 30px 0 30px;">
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background-color:#111111;border:1px solid #231f20;padding:18px;">
                        <p style="margin:0 0 8px 0;color:#e4bf6e;font-size:13px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                          Configuration Details
                        </p>
                        <p style="margin:0;color:#d5d5d5;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">
                          ${escapeHtml(data.heroLabel)}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;

  // NOTE: See SAS heroSection above for why the border is on the wrapping
  // <table> rather than the <img> — same Outlook `height:auto` bug applies
  // here, and it manifested as a gold frame with empty space below the
  // bathroom photo in customer-reported screenshots.
  const heroSection = `
              <tr>
                <td style="padding:18px 30px 4px 30px;">
                  <p style="margin:0 0 8px 0;color:#e4bf6e;font-size:13px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                    Selected Design Preview
                  </p>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid #e4bf6e;">
                    <tr>
                      <td style="padding:0;font-size:0;line-height:0;">
                        <a href="${escapeHtml(data.heroImageUrl)}" target="_blank" style="text-decoration:none;display:block;">
                          <img src="${escapeHtml(data.heroImageUrl)}" alt="Customer's selected design preview" width="540" border="0"
                            style="display:block;width:100%;height:auto;border:0;outline:none;-ms-interpolation-mode:bicubic;" />
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:8px 0 0 0;font-family:Arial,sans-serif;font-size:12px;color:#ababab;text-align:center;font-style:italic;">
                    ${escapeHtml(data.heroLabel)}
                  </p>
                </td>
              </tr>`;

  const galleryRows = data.galleryItems.length === 0
    ? ''
    : `
              <tr>
                <td style="padding:24px 30px 8px 30px;">
                  <p style="margin:0 0 6px 0;color:#e4bf6e;font-size:13px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                    All Designs From This Session (${data.galleryItems.length})
                  </p>
                  <p style="margin:0 0 14px 0;color:#ababab;font-size:12px;line-height:1.6;font-family:Arial,sans-serif;">
                    Other variations the customer generated. Click any item to view the image.
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                    style="border-collapse:collapse;border:1px solid #231f20;">
                    ${data.galleryItems
                      .map(
                        (item, idx) => `
                    <tr>
                      <td style="padding:10px 14px;border-bottom:${idx === data.galleryItems.length - 1 ? '0' : '1px solid #231f20'};vertical-align:top;width:36px;color:#777777;font-size:12px;font-family:Arial,sans-serif;">
                        ${idx + 1}.
                      </td>
                      <td style="padding:10px 14px 10px 0;border-bottom:${idx === data.galleryItems.length - 1 ? '0' : '1px solid #231f20'};vertical-align:top;font-family:Arial,sans-serif;">
                        <p style="margin:0 0 4px 0;color:#ffffff;font-size:13px;line-height:1.5;">
                          ${escapeHtml(item.label)}
                        </p>
                        <a href="${escapeHtml(item.imageUrl)}" target="_blank"
                          style="color:#e4bf6e;font-size:12px;text-decoration:underline;word-break:break-all;">
                          View image
                        </a>
                      </td>
                    </tr>`
                      )
                      .join('')}
                  </table>
                </td>
              </tr>`;

  const locationLine = data.outsideTerritory
    ? `This person requested a quote but is <strong style="color:#ffffff;">outside our service areas</strong>. If you believe they're close enough for a location to service, please forward the information below to the appropriate team.`
    : data.locationName
    ? `Routed to <strong style="color:#ffffff;">${escapeHtml(data.locationName)}</strong>.`
    : `No franchise territory matched the customer's zip code — please review and forward to the appropriate location.`;

  const nearestBlock = data.outsideTerritory
    ? `
              <tr>
                <td style="padding:18px 30px 0 30px;">
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background-color:#2a1f10;border:1px solid #e4bf6e;padding:18px;">
                        <p style="margin:0 0 8px 0;color:#e4bf6e;font-size:13px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                          Outside Service Area
                        </p>
                        <p style="margin:0;color:#d5d5d5;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">
                          The zip code they entered (<strong style="color:#ffffff;">${escapeHtml(data.customerZipCode)}</strong>) places them outside every active territory.
                          ${
                            data.nearestLocationName != null
                              ? `The closest location is <strong style="color:#ffffff;">${escapeHtml(
                                  data.nearestLocationName
                                )}</strong>${
                                  data.nearestDistanceMiles != null
                                    ? ` (~${Math.round(data.nearestDistanceMiles)} miles away)`
                                    : ''
                                }${
                                  data.nearestLocationEmail
                                    ? ` &mdash; <a href="mailto:${escapeHtml(
                                        data.nearestLocationEmail
                                      )}" style="color:#e4bf6e;text-decoration:underline;">${escapeHtml(
                                        data.nearestLocationEmail
                                      )}</a>`
                                    : ''
                                }.`
                              : `No nearby location could be determined automatically.`
                          }
                          If you believe they're close enough for that location to service, please forward the following information.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
    : '';

  return `<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <title>${escapeHtml(formatRaqSubject(data))}</title>
    <style>body { font-family: Arial, sans-serif; }</style>
</head>
<body style="margin:0;padding:0;background-color:#000000;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="auto" style="background-color:#000000;margin:0 auto;border:1px solid #231f20;border-radius:5px;margin:50px;width:600px;">
                    ${BRAND_HEADER}
                    <tr>
                        <td style="padding:22px 30px 6px 30px;color:#ffffff;font-family:Arial,sans-serif;">
                            <p style="margin:0 0 6px 0;color:#e4bf6e;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                                New Estimate Request
                            </p>
                            <p style="margin:0;color:#d5d5d5;font-size:13px;line-height:1.6;">
                                A potential customer has requested an estimate after designing their shower in the Gatsby Glass Visualizer. ${locationLine}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:18px 30px 0 30px;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="background-color:#111111;border:1px solid #231f20;padding:18px;">
                                        <p style="margin:0 0 10px 0;color:#e4bf6e;font-size:13px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                                            Customer Information
                                        </p>
                                        <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                                            ${customerInfoRows}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    ${nearestBlock}
                    ${configBlock}
                    ${heroSection}
                    ${galleryRows}
                    <tr>
                        <td style="padding:18px 30px 6px 30px;color:#777777;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;">
                            <p style="margin:0;">
                                Submitted: ${escapeHtml(submittedAt)}
                            </p>
                            <p style="margin:6px 0 0 0;">
                                This lead has also been logged in Constant Contact. Please reach out to the customer promptly.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:0 20px;">
                            <img src="${escapeHtml(EMAIL_FOOTER_BORDER_IMAGE_URL)}" alt="" width="100%" style="display:block;">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:14px;background-color:#231f20;color:#ababab;font-size:11px;line-height:1.6;font-family:Arial,sans-serif;">
                            &copy; Gatsby Glass &bull; A HorsePower Brands Company<br>
                            <a href="${escapeHtml(brandUrl)}" target="_blank" style="color:#e4bf6e;text-decoration:underline;">${escapeHtml(brandUrl.replace(/^https?:\/\//, ''))}</a>
                            &nbsp;&middot;&nbsp;
                            <a href="${escapeHtml(PRIVACY_POLICY_URL)}" target="_blank" style="color:#e4bf6e;text-decoration:underline;">Privacy Policy</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function renderRaqText(data: RaqEmailData): string {
  const lines: string[] = [];
  lines.push('NEW ESTIMATE REQUEST FROM THE GATSBY GLASS VISUALIZER');
  lines.push('');
  if (data.outsideTerritory) {
    lines.push('OUTSIDE SERVICE AREA');
    lines.push(
      '  This person requested a quote but is outside our service areas.'
    );
    lines.push(
      `  The zip code they entered (${data.customerZipCode}) places them outside every active territory.`
    );
    if (data.nearestLocationName != null) {
      const dist =
        data.nearestDistanceMiles != null
          ? ` (~${Math.round(data.nearestDistanceMiles)} miles away)`
          : '';
      lines.push(`  Closest location: ${data.nearestLocationName}${dist}`);
      if (data.nearestLocationEmail) {
        lines.push(`  Closest inbox:    ${data.nearestLocationEmail}`);
      }
    } else {
      lines.push('  No nearby location could be determined automatically.');
    }
    lines.push(
      '  If you believe they are close enough for that location to service,'
    );
    lines.push('  please forward the following information.');
  } else if (data.locationName) {
    lines.push(`Routed to: ${data.locationName}`);
  } else {
    lines.push('No franchise territory matched the customer\'s zip code.');
  }
  lines.push('');
  lines.push('CUSTOMER INFORMATION');
  lines.push(`  Name:      ${data.customerName}`);
  lines.push(`  Email:     ${data.customerEmail}`);
  lines.push(`  Phone:     ${data.customerPhone || '—'}`);
  lines.push(`  Zip Code:  ${data.customerZipCode}`);
  lines.push('');
  if (data.mode === 'inspiration') {
    lines.push('DESIGN MODE');
    lines.push('  Inspiration-based (customer uploaded a reference photo)');
  } else {
    lines.push('CONFIGURATION DETAILS');
    lines.push(`  ${data.heroLabel}`);
  }
  lines.push('');
  lines.push('SELECTED DESIGN PREVIEW');
  lines.push(`  ${data.heroImageUrl}`);
  lines.push('');
  if (data.galleryItems.length > 0) {
    lines.push(`ALL DESIGNS FROM THIS SESSION (${data.galleryItems.length})`);
    data.galleryItems.forEach((item, idx) => {
      lines.push(`  ${idx + 1}. ${item.label}`);
      lines.push(`     ${item.imageUrl}`);
    });
    lines.push('');
  }
  lines.push(`Submitted: ${formatSubmittedAt(data.submittedAt)}`);
  lines.push('');
  lines.push('This lead has also been logged in Constant Contact. Please reach');
  lines.push('out to the customer promptly.');
  return lines.join('\n');
}

/**
 * Public renderers exposed for previewing/testing. The actual email send
 * pipeline (`sendRaqEmail`/`sendSasEmail`) wraps these — these helpers just
 * return the HTML/text body without dispatching to Resend.
 */
export function renderRaqEmailHtml(data: RaqEmailData): string {
  return renderRaqHtml(data);
}

export function renderRaqEmailText(data: RaqEmailData): string {
  return renderRaqText(data);
}

export function renderSasEmailHtml(data: SasEmailData): string {
  return renderHtml(data);
}

export function renderSasEmailText(data: SasEmailData): string {
  return renderText(data);
}

/**
 * Send the "Request an Estimate" (RAQ) notification to the franchise location's
 * shared inbox. Returns `{ success: true }` on success or `{ success: false,
 * error }` on failure. Never throws.
 */
export async function sendRaqEmail(
  config: ResendConfig,
  data: RaqEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!config.apiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }
    if (!config.from) {
      return { success: false, error: 'Resend "from" address not configured' };
    }
    if (!data.toEmail) {
      return { success: false, error: 'Recipient email is required' };
    }

    const body: Record<string, unknown> = {
      from: config.from,
      to: [data.toEmail],
      subject: formatRaqSubject(data),
      html: renderRaqHtml(data),
      text: renderRaqText(data),
    };

    if (data.ccEmails && data.ccEmails.length > 0) {
      body.cc = data.ccEmails;
    }

    // Replies from the franchise should go directly to the customer so
    // the location can respond without copy/pasting the address.
    if (data.customerEmail) {
      body.reply_to = data.customerEmail;
    } else if (config.replyTo) {
      body.reply_to = config.replyTo;
    }

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[RESEND] RAQ HTTP ${response.status}: ${text}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const json = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null;

    if (!json || !json.id) {
      console.error('[RESEND] RAQ unexpected response shape:', JSON.stringify(json));
      return { success: false, error: 'Unexpected response from Resend' };
    }

    console.log(
      `[RESEND] RAQ email queued for ${data.toEmail} (id: ${json.id}, gallery items: ${data.galleryItems.length}, location: ${data.locationName ?? 'NO_TERRITORY'})`
    );
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[RESEND] RAQ unexpected error:', msg);
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Request a Quote (RAQ) — customer confirmation
// ---------------------------------------------------------------------------

function formatCustomerQuoteSubject(data: CustomerQuoteEmailData): string {
  return data.matched
    ? "We've received your Gatsby Glass quote request"
    : 'About your Gatsby Glass quote request';
}

function renderCustomerQuoteHtml(data: CustomerQuoteEmailData): string {
  const brandUrl = data.brandUrl || DEFAULT_BRAND_URL;
  const greetingName = data.firstName ? escapeHtml(data.firstName) : 'there';

  const bodyBlock = data.matched
    ? `
                            <p style="margin:0 0 14px 0;color:#d5d5d5;font-size:14px;line-height:1.7;">
                                Thanks for requesting a quote with the Gatsby Glass Visualizer! We've
                                notified your local Gatsby Glass team${
                                  data.locationName
                                    ? ` (<strong style="color:#ffffff;">${escapeHtml(
                                        data.locationName
                                      )}</strong>)`
                                    : ''
                                }, and they'll be in touch soon to help bring your design to life.
                            </p>
                            <p style="margin:0;color:#d5d5d5;font-size:14px;line-height:1.7;">
                                In the meantime, if you have any questions you can reach us at
                                <a href="tel:${escapeHtml(data.supportPhoneTel)}" style="color:#e4bf6e;text-decoration:underline;">${escapeHtml(
                                  data.supportPhone
                                )}</a>.
                            </p>`
    : `
                            <p style="margin:0 0 14px 0;color:#d5d5d5;font-size:14px;line-height:1.7;">
                                Thanks for requesting a quote with the Gatsby Glass Visualizer! It looks
                                like the zip code you entered is just outside of our current service
                                area, so we're looking into how we can assist you.
                            </p>
                            <p style="margin:0;color:#d5d5d5;font-size:14px;line-height:1.7;">
                                We'd still love to help. Give us a call at
                                <a href="tel:${escapeHtml(data.supportPhoneTel)}" style="color:#e4bf6e;text-decoration:underline;">${escapeHtml(
                                  data.supportPhone
                                )}</a>
                                or get in touch through our
                                <a href="${escapeHtml(data.contactUrl)}" target="_blank" style="color:#e4bf6e;text-decoration:underline;">Contact Page</a>
                                and we'll do our best to help out how we can!
                            </p>`;

  return `<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <title>${escapeHtml(formatCustomerQuoteSubject(data))}</title>
    <style>body { font-family: Arial, sans-serif; }</style>
</head>
<body style="margin:0;padding:0;background-color:#000000;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="auto" style="background-color:#000000;margin:0 auto;border:1px solid #231f20;border-radius:5px;margin:50px;width:600px;">
                    ${BRAND_HEADER}
                    <tr>
                        <td style="padding:24px 30px 6px 30px;color:#ffffff;font-family:Arial,sans-serif;">
                            <p style="margin:0 0 14px 0;color:#ffffff;font-size:16px;line-height:1.5;">
                                Hi ${greetingName},
                            </p>
                            ${bodyBlock}
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:18px 20px 0 20px;">
                            <img src="${escapeHtml(EMAIL_FOOTER_BORDER_IMAGE_URL)}" alt="" width="100%" style="display:block;">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:14px;background-color:#231f20;color:#ababab;font-size:11px;line-height:1.6;font-family:Arial,sans-serif;">
                            &copy; Gatsby Glass &bull; A HorsePower Brands Company<br>
                            <a href="${escapeHtml(brandUrl)}" target="_blank" style="color:#e4bf6e;text-decoration:underline;">${escapeHtml(brandUrl.replace(/^https?:\/\//, ''))}</a>
                            &nbsp;&middot;&nbsp;
                            <a href="${escapeHtml(PRIVACY_POLICY_URL)}" target="_blank" style="color:#e4bf6e;text-decoration:underline;">Privacy Policy</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function renderCustomerQuoteText(data: CustomerQuoteEmailData): string {
  const lines: string[] = [];
  lines.push(`Hi ${data.firstName || 'there'},`);
  lines.push('');
  if (data.matched) {
    lines.push(
      "Thanks for requesting a quote with the Gatsby Glass Visualizer! We've notified your local"
    );
    lines.push(
      `Gatsby Glass team${
        data.locationName ? ` (${data.locationName})` : ''
      }, and they'll be in touch soon to help bring your design to life.`
    );
    lines.push('');
    lines.push(`Questions? Call us at ${data.supportPhone}.`);
  } else {
    lines.push(
      'Thanks for requesting a quote with the Gatsby Glass Visualizer! It looks like the zip code'
    );
    lines.push(
      "you entered is just outside of our current service area, so we're looking into how we can"
    );
    lines.push('assist you.');
    lines.push('');
    lines.push("We'd still love to help. Give us a call or get in touch and we'll do our best to");
    lines.push('help out how we can!');
    lines.push(`  Call:    ${data.supportPhone}`);
    lines.push(`  Contact: ${data.contactUrl}`);
  }
  lines.push('');
  lines.push('— Gatsby Glass');
  return lines.join('\n');
}

/**
 * Public renderers exposed for previewing/testing the customer quote email.
 */
export function renderCustomerQuoteEmailHtml(data: CustomerQuoteEmailData): string {
  return renderCustomerQuoteHtml(data);
}

export function renderCustomerQuoteEmailText(data: CustomerQuoteEmailData): string {
  return renderCustomerQuoteText(data);
}

/**
 * Send the customer-facing confirmation after a Request-a-Quote submission.
 * Returns `{ success: true }` on success or `{ success: false, error }` on
 * failure. Never throws.
 */
export async function sendCustomerQuoteEmail(
  config: ResendConfig,
  data: CustomerQuoteEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!config.apiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }
    if (!config.from) {
      return { success: false, error: 'Resend "from" address not configured' };
    }
    if (!data.toEmail) {
      return { success: false, error: 'Recipient email is required' };
    }

    const body: Record<string, unknown> = {
      from: config.from,
      to: [data.toEmail],
      subject: formatCustomerQuoteSubject(data),
      html: renderCustomerQuoteHtml(data),
      text: renderCustomerQuoteText(data),
    };

    if (config.replyTo) {
      body.reply_to = config.replyTo;
    }

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[RESEND] Customer quote HTTP ${response.status}: ${text}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const json = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null;

    if (!json || !json.id) {
      console.error('[RESEND] Customer quote unexpected response shape:', JSON.stringify(json));
      return { success: false, error: 'Unexpected response from Resend' };
    }

    console.log(
      `[RESEND] Customer quote email queued for ${data.toEmail} (id: ${json.id}, matched: ${data.matched})`
    );
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[RESEND] Customer quote unexpected error:', msg);
    return { success: false, error: msg };
  }
}
