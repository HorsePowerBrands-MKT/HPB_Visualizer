#!/usr/bin/env node
// Generates static HTML previews of every transactional email the app
// sends, by invoking the *actual* renderers from
// `packages/api-handlers/src/resend.ts`. This keeps the previews in lockstep
// with what Resend actually delivers — there is no duplicated render logic.
//
// Output (all written to apps/gatsby-glass/public/email-preview/):
//   - index.html             Landing page that links to every variant
//   - sas-configure.html     SAS · customer · configure mode
//   - sas-inspiration.html   SAS · customer · inspiration mode
//   - raq-configure.html     RAQ · franchise · configure mode
//   - raq-inspiration.html   RAQ · franchise · inspiration mode
//   - raq-no-territory.html  RAQ · brand fallback (zip not in any territory)
//
// Usage (from repo root):
//   pnpm preview:emails
//   # or
//   node --experimental-strip-types apps/gatsby-glass/scripts/preview-emails.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  renderSasEmailHtml,
  renderRaqEmailHtml,
} from '../../../packages/api-handlers/src/resend.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public/email-preview');

const PLACEHOLDER = (label) =>
  `https://placehold.co/1200x800/0a0a0a/e4bf6e?text=${encodeURIComponent(label)}`;

// ---------------------------------------------------------------------------
// Sample data shared across variants
// ---------------------------------------------------------------------------

const SAMPLE_GALLERY = [
  {
    imageUrl: PLACEHOLDER('Variation 1'),
    label:
      'Hinged Door · Semi-Frameless framing · Polished Chrome hardware · Ladder Pull handle',
  },
  {
    imageUrl: PLACEHOLDER('Variation 2'),
    label:
      'Pivot Door · Frameless framing · Matte Black hardware · Crescent (D) Pull handle',
  },
  {
    imageUrl: PLACEHOLDER('Variation 3'),
    label:
      'Sliding Door · Framed framing · Oil Rubbed Bronze hardware · Knob handle',
  },
];

const SAMPLE_HERO_LABEL =
  'Hinged Door · Frameless framing · Matte Black hardware · Square Pull handle';

const SAMPLE_HERO_CONFIG = {
  enclosure: 'Hinged Door',
  framing: 'Frameless',
  hardware: 'Matte Black',
  handle: 'Square Pull',
};

const SAMPLE_CUSTOMER = {
  customerName: 'Jane Doe',
  customerEmail: 'jane.doe@example.com',
  customerPhone: '(415) 555-0142',
  customerZipCode: '94110',
  submittedAt: new Date('2026-04-29T18:24:00.000Z').toISOString(),
};

// ---------------------------------------------------------------------------
// Variants — each describes one email exactly as it will be delivered.
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Variant
 * @property {string}  fileName    Output HTML file name.
 * @property {'SAS'|'RAQ'} kind    Email type label.
 * @property {string}  title       Human-readable title for the index.
 * @property {string}  subject     Subject line that will appear in the inbox.
 * @property {string}  recipient   Description of who receives this email.
 * @property {string}  description One-line summary of the variant.
 * @property {string}  html        Rendered HTML body.
 */

/** @type {Variant[]} */
const variants = [
  {
    fileName: 'sas-configure.html',
    kind: 'SAS',
    title: 'SAS · Customer · Configure mode',
    subject: 'Your Gatsby Glass Design Preview',
    recipient: 'Customer (the email entered on the form)',
    description:
      'Sent when the customer clicks "Save & Send to Me" after configuring an enclosure manually.',
    html: renderSasEmailHtml({
      toEmail: SAMPLE_CUSTOMER.customerEmail,
      firstName: 'Jane',
      heroImageUrl: PLACEHOLDER('Selected Design'),
      heroLabel: SAMPLE_HERO_LABEL,
      heroConfig: SAMPLE_HERO_CONFIG,
      galleryItems: SAMPLE_GALLERY,
      mode: 'configure',
    }),
  },
  {
    fileName: 'sas-inspiration.html',
    kind: 'SAS',
    title: 'SAS · Customer · Inspiration mode',
    subject: 'Your Gatsby Glass Design Preview',
    recipient: 'Customer (the email entered on the form)',
    description:
      'Sent after the customer uploads an inspiration photo and clicks "Save & Send to Me".',
    html: renderSasEmailHtml({
      toEmail: SAMPLE_CUSTOMER.customerEmail,
      firstName: 'Jane',
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
    }),
  },
  {
    fileName: 'raq-configure.html',
    kind: 'RAQ',
    title: 'RAQ · Franchise · Configure mode',
    subject: `New Visualizer Estimate Request — ${SAMPLE_CUSTOMER.customerName} (${SAMPLE_CUSTOMER.customerZipCode})`,
    recipient:
      'Franchise shared inbox — resolved via territory_zipcodes → team_locations',
    description:
      'Sent to the matched franchise location when the customer clicks "Request an Estimate" after configuring.',
    html: renderRaqEmailHtml({
      toEmail: 'franchise-sf@example.com',
      locationName: 'Gatsby Glass — San Francisco Bay',
      ...SAMPLE_CUSTOMER,
      heroImageUrl: PLACEHOLDER('Selected Design'),
      heroLabel: SAMPLE_HERO_LABEL,
      galleryItems: SAMPLE_GALLERY,
      mode: 'configure',
    }),
  },
  {
    fileName: 'raq-inspiration.html',
    kind: 'RAQ',
    title: 'RAQ · Franchise · Inspiration mode',
    subject: `New Visualizer Estimate Request — ${SAMPLE_CUSTOMER.customerName} (${SAMPLE_CUSTOMER.customerZipCode})`,
    recipient:
      'Franchise shared inbox — resolved via territory_zipcodes → team_locations',
    description:
      'Sent to the matched franchise when the customer requested an estimate after using inspiration mode.',
    html: renderRaqEmailHtml({
      toEmail: 'franchise-austin@example.com',
      locationName: 'Gatsby Glass — Austin Metro',
      ...SAMPLE_CUSTOMER,
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
    }),
  },
  {
    fileName: 'raq-no-territory.html',
    kind: 'RAQ',
    title: 'RAQ · Brand fallback · No territory match',
    subject: `New Visualizer Estimate Request — ${SAMPLE_CUSTOMER.customerName} (99999)`,
    recipient: 'CustomerJourney@horsepowerbrands.com (brand monitoring inbox)',
    description:
      "Sent when the customer's zip code does not match any franchise territory.",
    html: renderRaqEmailHtml({
      toEmail: 'CustomerJourney@horsepowerbrands.com',
      locationName: null,
      ...SAMPLE_CUSTOMER,
      customerZipCode: '99999',
      heroImageUrl: PLACEHOLDER('Selected Design'),
      heroLabel:
        'Sliding Door · Frameless framing · Polished Chrome hardware · Knob handle',
      galleryItems: SAMPLE_GALLERY.slice(0, 2),
      mode: 'configure',
    }),
  },
];

// ---------------------------------------------------------------------------
// Index page
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderIndex(items) {
  const groupedByKind = items.reduce((acc, v) => {
    (acc[v.kind] ||= []).push(v);
    return acc;
  }, {});

  const groupTitles = {
    SAS: 'SAS · Save & Send to Me — sent to the customer',
    RAQ: 'RAQ · Request an Estimate — sent to the franchise',
  };

  const sections = Object.entries(groupedByKind)
    .map(
      ([kind, group]) => `
        <section style="margin:0 0 32px 0;">
          <h2 style="color:#e4bf6e;font-size:14px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px 0;border-bottom:1px solid #231f20;padding-bottom:8px;">
            ${escapeHtml(groupTitles[kind] || kind)}
          </h2>
          <ul style="list-style:none;padding:0;margin:0;">
            ${group
              .map(
                (item) => `
            <li style="margin:0 0 16px 0;padding:14px 16px;background:#111111;border:1px solid #231f20;border-radius:4px;">
              <a href="${escapeHtml(item.fileName)}" style="color:#ffffff;font-size:15px;text-decoration:none;font-weight:600;">
                ${escapeHtml(item.title)} →
              </a>
              <div style="color:#d5d5d5;font-size:13px;margin-top:6px;line-height:1.5;">
                ${escapeHtml(item.description)}
              </div>
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-top:8px;">
                <tr>
                  <td style="color:#777777;font-size:11px;padding:1px 8px 1px 0;letter-spacing:1px;text-transform:uppercase;vertical-align:top;white-space:nowrap;">Subject</td>
                  <td style="color:#e4bf6e;font-size:12px;padding:1px 0;font-family:monospace;">${escapeHtml(item.subject)}</td>
                </tr>
                <tr>
                  <td style="color:#777777;font-size:11px;padding:1px 8px 1px 0;letter-spacing:1px;text-transform:uppercase;vertical-align:top;white-space:nowrap;">To</td>
                  <td style="color:#ababab;font-size:12px;padding:1px 0;">${escapeHtml(item.recipient)}</td>
                </tr>
              </table>
            </li>`
              )
              .join('')}
          </ul>
        </section>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Gatsby Glass — Email Previews</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#fff;">
  <div style="max-width:760px;margin:0 auto;padding:40px 24px;">
    <h1 style="color:#e4bf6e;font-size:22px;margin:0 0 8px 0;letter-spacing:2px;text-transform:uppercase;">
      Gatsby Glass — Email Previews
    </h1>
    <p style="color:#ababab;font-size:13px;line-height:1.6;margin:0 0 28px 0;">
      Static renders of every transactional email the visualizer sends. These are
      generated directly from the production renderers in
      <code style="color:#e4bf6e;">packages/api-handlers/src/resend.ts</code>, so what you
      see here is exactly what Resend will deliver. Regenerate with
      <code style="color:#e4bf6e;">pnpm preview:emails</code> after editing the templates.
    </p>
    ${sections}
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Write outputs
// ---------------------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });

for (const variant of variants) {
  writeFileSync(resolve(OUT_DIR, variant.fileName), variant.html, 'utf8');
}

writeFileSync(resolve(OUT_DIR, 'index.html'), renderIndex(variants), 'utf8');

console.log(`Wrote ${variants.length + 1} files to ${OUT_DIR}`);
console.log('  - index.html');
for (const v of variants) console.log(`  - ${v.fileName}  (${v.kind})`);
console.log('\nOpen the index in a browser:');
console.log(`  open ${resolve(OUT_DIR, 'index.html')}`);
console.log('\nOr (if dev server is running):');
console.log('  http://localhost:3000/email-preview/');
