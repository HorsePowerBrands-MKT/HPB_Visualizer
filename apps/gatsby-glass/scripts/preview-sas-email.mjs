#!/usr/bin/env node
// Standalone preview generator for the SAS email.
// Mirrors the render logic in packages/api-handlers/src/resend.ts so we can
// eyeball the layout without running the full Next.js API route.
//
// Usage: node apps/gatsby-glass/scripts/preview-sas-email.mjs > /tmp/email.html

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SUBJECT_LINE = 'Your Gatsby Glass Shower Visualization';
const DEFAULT_BRAND_URL = 'https://www.gatsbyglass.com';

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHtml(data) {
  const brandUrl = data.brandUrl || DEFAULT_BRAND_URL;
  const isInspiration = data.mode === 'inspiration';

  const heroSection = `
    <tr>
      <td style="padding:0 24px 8px 24px;">
        <img src="${escapeHtml(data.heroImageUrl)}" alt="Your selected shower visualization"
          style="display:block;width:100%;max-width:552px;height:auto;border:1px solid #d6c08a;" />
        <p style="margin:8px 0 0 0;font-family:Georgia,serif;font-size:13px;color:#6b5b3a;text-align:center;font-style:italic;">
          ${escapeHtml(data.heroLabel)}
        </p>
      </td>
    </tr>`;

  const configBlock = isInspiration
    ? `
    <tr>
      <td style="padding:24px;background:#faf6ec;border:1px solid #e6d8b3;">
        <p style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:14px;color:#a37529;font-weight:bold;letter-spacing:1px;">
          YOUR DESIGN
        </p>
        <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#3d3325;line-height:1.6;">
          Based on your uploaded inspiration photo, tailored to your bathroom's unique layout.
        </p>
      </td>
    </tr>`
    : `
    <tr>
      <td style="padding:24px;background:#faf6ec;border:1px solid #e6d8b3;">
        <p style="margin:0 0 12px 0;font-family:Georgia,serif;font-size:14px;color:#a37529;font-weight:bold;letter-spacing:1px;">
          YOUR SELECTED CONFIGURATION
        </p>
        <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#3d3325;line-height:1.7;">
          ${escapeHtml(data.heroLabel)}
        </p>
      </td>
    </tr>`;

  const galleryRows = data.galleryItems.length === 0
    ? ''
    : `
    <tr>
      <td style="padding:24px 24px 8px 24px;">
        <p style="margin:0 0 4px 0;font-family:Georgia,serif;font-size:16px;color:#a37529;font-weight:bold;">
          More designs you tried
        </p>
        <p style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:13px;color:#6b5b3a;">
          Other variations from this session, with the configuration that produced each one.
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          ${data.galleryItems
            .map(
              (item) => `
          <tr>
            <td style="padding:0 0 16px 0;">
              <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.label)}"
                style="display:block;width:100%;max-width:552px;height:auto;border:1px solid #d6c08a;" />
              <p style="margin:6px 0 0 0;font-family:Georgia,serif;font-size:12px;color:#6b5b3a;text-align:center;font-style:italic;">
                ${escapeHtml(item.label)}
              </p>
            </td>
          </tr>`
            )
            .join('')}
        </table>
      </td>
    </tr>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(SUBJECT_LINE)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5efdf;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5efdf;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
            style="max-width:600px;background:#ffffff;border:1px solid #e6d8b3;">
            <tr>
              <td style="padding:24px 24px 8px 24px;font-family:Georgia,serif;color:#3d3325;">
                <p style="margin:0 0 12px 0;font-size:16px;">Hi ${escapeHtml(data.firstName)},</p>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;">
                  Thanks for using the Gatsby Glass Visualizer! Here's the custom shower
                  design you created.
                </p>
              </td>
            </tr>
            ${heroSection}
            <tr>
              <td style="padding:16px 24px 0 24px;">
                ${configBlock.trim()}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;">
                <p style="margin:0;font-family:Georgia,serif;font-size:12px;color:#6b5b3a;line-height:1.6;font-style:italic;">
                  This visualization is AI-generated and intended for illustrative purposes
                  only. Actual product appearance, dimensions, and finish may vary.
                </p>
              </td>
            </tr>
            ${galleryRows}
            <tr>
              <td style="padding:24px;background:#3d3325;text-align:center;">
                <p style="margin:0 0 12px 0;font-family:Georgia,serif;font-size:15px;color:#e4bf6e;font-weight:bold;letter-spacing:1px;">
                  READY TO BRING THIS DESIGN TO LIFE?
                </p>
                <p style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:14px;color:#f5efdf;line-height:1.6;">
                  A local Gatsby Glass professional can walk you through your options,
                  take measurements, and provide a detailed quote — all at no cost.
                </p>
                <a href="${escapeHtml(brandUrl)}"
                  style="display:inline-block;padding:12px 28px;background:#a37529;color:#ffffff;text-decoration:none;font-family:Georgia,serif;font-size:14px;font-weight:bold;letter-spacing:1px;border:1px solid #e4bf6e;">
                  REQUEST A QUOTE
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;">
                <p style="margin:0;font-family:Georgia,serif;font-size:12px;color:#6b5b3a;text-align:center;">
                  Your visualization will be available for 30 days.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid #e6d8b3;">
                <p style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:13px;color:#6b5b3a;text-align:center;">
                  — Gatsby Glass<br />
                  <a href="${escapeHtml(brandUrl)}" style="color:#a37529;">www.gatsbyglass.com</a>
                </p>
                <p style="margin:8px 0 0 0;font-family:Georgia,serif;font-size:11px;color:#9e8a5a;text-align:center;line-height:1.5;">
                  You are receiving this email because you requested your shower
                  visualization be sent to this address. If you believe this was sent
                  in error, you can disregard this message.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const PLACEHOLDER = (seed, label) =>
  `https://placehold.co/1200x800/3d3325/e4bf6e?text=${encodeURIComponent(label)}`;

const sampleData = {
  firstName: 'Jane',
  mode: 'configure',
  heroImageUrl: PLACEHOLDER('hero', 'Selected Design'),
  heroLabel: 'Hinged Door · Frameless framing · Matte Black hardware · Square Pull handle',
  galleryItems: [
    {
      imageUrl: PLACEHOLDER('g1', 'Variation 1'),
      label: 'Hinged Door · Semi-Frameless framing · Polished Chrome hardware · Ladder Pull handle',
    },
    {
      imageUrl: PLACEHOLDER('g2', 'Variation 2'),
      label: 'Pivot Door · Frameless framing · Matte Black hardware · Crescent (D) Pull handle',
    },
    {
      imageUrl: PLACEHOLDER('g3', 'Variation 3'),
      label: 'Sliding Door · Framed framing · Oil Rubbed Bronze hardware · Knob handle',
    },
  ],
};

const html = renderHtml(sampleData);
const outPath = resolve(process.cwd(), 'apps/gatsby-glass/public/email-preview.html');
writeFileSync(outPath, html, 'utf8');
console.log(`Preview written to ${outPath}`);
