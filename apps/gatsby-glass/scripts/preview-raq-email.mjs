#!/usr/bin/env node
// Standalone preview generator for the RAQ (Request a Quote) email that
// goes to the franchise location's shared inbox.
//
// Mirrors the render logic in packages/api-handlers/src/resend.ts so we can
// eyeball the layout without running the full Next.js API route.
//
// Writes three variants to apps/gatsby-glass/public/email-preview/:
//   - raq-configure.html        (configure mode, matched franchise)
//   - raq-inspiration.html      (inspiration mode, matched franchise)
//   - raq-no-territory.html     (configure mode, no franchise → support fallback)
//   - raq-index.html            (links to the above)
//
// Usage:
//   node apps/gatsby-glass/scripts/preview-raq-email.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_BRAND_URL = 'https://www.gatsbyglass.com';
const PRIVACY_POLICY_URL = 'https://www.horsepowerbrands.com/privacy-policy';
const RAQ_EMAIL_HEADER_IMAGE_URL =
  'https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/NewQuote.webp';
const EMAIL_FOOTER_BORDER_IMAGE_URL =
  'https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/GG%20Email%20Border%204.png';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRaqSubject(data) {
  return `New Visualizer Quote Request — ${data.customerName} (${data.customerZipCode})`;
}

function formatSubmittedAt(iso) {
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

function renderRaqHtml(data) {
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

  const heroSection = `
              <tr>
                <td style="padding:18px 30px 4px 30px;">
                  <p style="margin:0 0 8px 0;color:#e4bf6e;font-size:13px;font-family:Arial,sans-serif;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                    Selected Visualization
                  </p>
                  <a href="${escapeHtml(data.heroImageUrl)}" target="_blank" style="text-decoration:none;">
                    <img src="${escapeHtml(data.heroImageUrl)}" alt="Customer's selected visualization"
                      style="display:block;width:100%;height:auto;border:1px solid #e4bf6e;" />
                  </a>
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
                      <td style="padding:10px 14px;border-bottom:${
                        idx === data.galleryItems.length - 1 ? '0' : '1px solid #231f20'
                      };vertical-align:top;width:36px;color:#777777;font-size:12px;font-family:Arial,sans-serif;">
                        ${idx + 1}.
                      </td>
                      <td style="padding:10px 14px 10px 0;border-bottom:${
                        idx === data.galleryItems.length - 1 ? '0' : '1px solid #231f20'
                      };vertical-align:top;font-family:Arial,sans-serif;">
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

  const locationLine = data.locationName
    ? `Routed to <strong style="color:#ffffff;">${escapeHtml(data.locationName)}</strong>.`
    : `No franchise territory matched the customer's zip code — please review and forward to the appropriate location.`;

  return `<!doctype html>
<html>
<head>
    <title>${escapeHtml(formatRaqSubject(data))}</title>
    <style>body { font-family: Arial, sans-serif; }</style>
</head>
<body style="margin:0;padding:0;background-color:#000000;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="auto" style="background-color:#000000;margin:0 auto;border:1px solid #231f20;border-radius:5px;margin:50px;width:600px;">
                    <tr>
                        <td align="center" style="padding:0;color:#ffffff;font-size:24px;width:600px;">
                            <img src="${escapeHtml(RAQ_EMAIL_HEADER_IMAGE_URL)}" alt="New Quote Request" width="100%" style="display:block;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:22px 30px 6px 30px;color:#ffffff;font-family:Arial,sans-serif;">
                            <p style="margin:0 0 6px 0;color:#e4bf6e;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                                New Quote Request
                            </p>
                            <p style="margin:0;color:#d5d5d5;font-size:13px;line-height:1.6;">
                                A potential customer has requested a quote after designing their shower in the Gatsby Glass Visualizer. ${locationLine}
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

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const PLACEHOLDER = (label, bg = '0a0a0a', fg = 'e4bf6e') =>
  `https://placehold.co/1200x800/${bg}/${fg}?text=${encodeURIComponent(label)}`;

const sampleGallery = [
  {
    imageUrl: PLACEHOLDER('Variation 1'),
    label: 'Hinged Door · Semi-Frameless framing · Polished Chrome hardware · Ladder Pull handle',
  },
  {
    imageUrl: PLACEHOLDER('Variation 2'),
    label: 'Pivot Door · Frameless framing · Matte Black hardware · Crescent (D) Pull handle',
  },
  {
    imageUrl: PLACEHOLDER('Variation 3'),
    label: 'Sliding Door · Framed framing · Oil Rubbed Bronze hardware · Knob handle',
  },
  {
    imageUrl: PLACEHOLDER('Variation 4'),
    label: 'Hinged Door · Frameless framing · Brushed Nickel hardware · Square Pull handle',
  },
];

const baseCustomer = {
  customerName: 'Jane Doe',
  customerEmail: 'jane.doe@example.com',
  customerPhone: '(415) 555-0142',
  customerZipCode: '94110',
  submittedAt: new Date('2026-04-29T18:24:00.000Z').toISOString(),
};

const variants = [
  {
    fileName: 'raq-configure.html',
    title: 'RAQ — Configure mode (matched franchise)',
    data: {
      ...baseCustomer,
      locationName: 'Gatsby Glass — San Francisco Bay',
      heroImageUrl: PLACEHOLDER('Selected Design'),
      heroLabel:
        'Hinged Door · Frameless framing · Matte Black hardware · Square Pull handle',
      galleryItems: sampleGallery,
      mode: 'configure',
    },
  },
  {
    fileName: 'raq-inspiration.html',
    title: 'RAQ — Inspiration mode (matched franchise)',
    data: {
      ...baseCustomer,
      locationName: 'Gatsby Glass — Austin Metro',
      heroImageUrl: PLACEHOLDER('Inspiration Design'),
      heroLabel: 'Inspiration design · Apr 29, 1:24 PM',
      galleryItems: [
        {
          imageUrl: PLACEHOLDER('Inspiration v1'),
          label: 'Inspiration design · Apr 29, 12:58 PM',
        },
        {
          imageUrl: PLACEHOLDER('Inspiration v2'),
          label: 'Inspiration design · Apr 29, 1:11 PM',
        },
      ],
      mode: 'inspiration',
    },
  },
  {
    fileName: 'raq-no-territory.html',
    title: 'RAQ — No territory match (support fallback)',
    data: {
      ...baseCustomer,
      customerZipCode: '99999',
      locationName: null,
      heroImageUrl: PLACEHOLDER('Selected Design'),
      heroLabel:
        'Sliding Door · Frameless framing · Polished Chrome hardware · Knob handle',
      galleryItems: sampleGallery.slice(0, 2),
      mode: 'configure',
    },
  },
];

// ---------------------------------------------------------------------------
// Index page
// ---------------------------------------------------------------------------

function renderIndex(items) {
  const rows = items
    .map(
      (item) => `
        <li style="margin:0 0 14px 0;">
          <a href="${escapeHtml(item.fileName)}" style="color:#e4bf6e;font-size:15px;text-decoration:underline;">
            ${escapeHtml(item.title)}
          </a>
          <div style="color:#9a9a9a;font-size:12px;margin-top:2px;">
            ${escapeHtml(formatRaqSubject(item.data))}
          </div>
          <div style="color:#777;font-size:11px;margin-top:2px;">
            To: ${escapeHtml(
              item.data.locationName
                ? `<franchise shared inbox> · ${item.data.locationName}`
                : 'support@gatsbyglass.com (no-territory fallback)'
            )} · Mode: ${escapeHtml(item.data.mode)}
          </div>
        </li>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>RAQ Email Previews</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#fff;">
    <div style="max-width:680px;margin:0 auto;padding:32px 24px;">
        <h1 style="color:#e4bf6e;font-size:22px;margin:0 0 8px 0;letter-spacing:2px;text-transform:uppercase;">
            RAQ Email Previews
        </h1>
        <p style="color:#ababab;font-size:13px;line-height:1.6;margin:0 0 24px 0;">
            Static renders of the new "Request a Quote" notification that goes to the
            franchise location's shared inbox. The hero image (the visualization the
            customer was viewing when they clicked Request a Quote) is rendered inline.
            Other generations from the session are listed as labeled links rather than
            inline images so the email stays lightweight.
        </p>
        <ul style="list-style:none;padding:0;margin:0;">
            ${rows}
        </ul>
    </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Write outputs
// ---------------------------------------------------------------------------

const outDir = resolve(process.cwd(), 'apps/gatsby-glass/public/email-preview');
mkdirSync(outDir, { recursive: true });

for (const variant of variants) {
  const html = renderRaqHtml(variant.data);
  writeFileSync(resolve(outDir, variant.fileName), html, 'utf8');
}

const indexHtml = renderIndex(variants);
writeFileSync(resolve(outDir, 'raq-index.html'), indexHtml, 'utf8');

console.log(`Wrote ${variants.length + 1} files to ${outDir}`);
for (const v of variants) console.log(`  - ${v.fileName}`);
console.log(`  - raq-index.html (index)`);
