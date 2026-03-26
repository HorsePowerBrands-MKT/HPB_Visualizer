# GatsbyView Security Overview

**Document Date:** March 26, 2026
**Application:** GatsbyView (Gatsby Glass AI Shower Visualizer)
**Maintained by:** Horse Power Brands, LLC

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [HTTP Security Headers](#3-http-security-headers)
4. [Input Validation & Sanitization](#4-input-validation--sanitization)
5. [API Security & Rate Limiting](#5-api-security--rate-limiting)
6. [Data Storage & Encryption](#6-data-storage--encryption)
7. [Image Handling & Content Safety](#7-image-handling--content-safety)
8. [Secret & Key Management](#8-secret--key-management)
9. [Session Management](#9-session-management)
10. [Data Retention & Automated Cleanup](#10-data-retention--automated-cleanup)
11. [TCPA Compliance & Consent Evidence](#11-tcpa-compliance--consent-evidence)
12. [Privacy & Legal Compliance](#12-privacy--legal-compliance)
13. [Intellectual Property Protection](#13-intellectual-property-protection)
14. [Third-Party Service Security](#14-third-party-service-security)
15. [Deployment & Infrastructure Security](#15-deployment--infrastructure-security)
16. [File Upload Security](#16-file-upload-security)
17. [Cron Job Security](#17-cron-job-security)
18. [Client-Side Security](#18-client-side-security)
19. [Known Considerations & Future Improvements](#19-known-considerations--future-improvements)

---

## 1. Architecture Overview

GatsbyView operates as a Next.js 14 (App Router) application within a pnpm monorepo. The security-relevant architecture layers are:

- **Frontend:** Next.js React app served via Vercel, communicating only with same-origin `/api/*` routes
- **Backend:** Next.js Route Handlers (server-side only), acting as a secure proxy between the client and all third-party services
- **Database / Auth / Storage:** Supabase (PostgreSQL, Auth, Storage) — all accessed server-side via service role key
- **AI Service:** Google Gemini — accessed exclusively server-side, never from the client
- **Hosting:** Vercel — provides edge network, DDoS protection, and automatic HTTPS

All sensitive operations (database writes, AI calls, storage uploads) happen server-side. The browser never directly communicates with Supabase, Google, or any other external service.

---

## 2. Authentication & Authorization

### Magic Link Authentication (Team Members)

Team/franchise login uses **Supabase Auth with email-based magic links (OTP)** via the **PKCE flow**, which prevents interception attacks:

- **Pre-validation gate:** Before any magic link is sent, the server-side route (`/api/auth/send-magic-link`) verifies the email exists in the `team_locations` table and is marked `is_active`. Unrecognized or inactive emails receive a `403 Forbidden` — no magic link is ever sent.
- **Post-authentication enforcement:** After the magic link is exchanged for a session at `/auth/callback`, a **second server-side check** using the service role client re-verifies the user's email against `team_locations`. If the check fails, the session is **immediately terminated** (`signOut()`) and the user is redirected to `/login?error=unauthorized`.
- **Double-gated access:** This two-step validation (pre-send + post-exchange) ensures that even if someone intercepts a magic link, they cannot gain access without an active `team_locations` entry.

### Public User Identification

- Anonymous users are identified by a random **UUIDv4** stored in `localStorage` (key: `hpb_user_id`). This is not linked to personal identity unless the user voluntarily submits a lead form.
- The UUID is validated server-side using Zod's `z.string().uuid()` schema to prevent injection via crafted identifiers.

### Authorization Model

| User Type | Capabilities | Rate Limited |
|-----------|-------------|-------------|
| Anonymous (public) | Generate visualizations, submit leads, report issues | Yes — monthly cap of 10 generations |
| Authenticated team member | All public capabilities + unlimited generations, user ID linked to saved visualizations | No |

---

## 3. HTTP Security Headers

All routes are protected by security headers configured in `next.config.js`:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing attacks |
| `X-XSS-Protection` | `1; mode=block` | Enables browser XSS filtering |
| `Content-Security-Policy` | `frame-ancestors 'self' https://*.horsepowerbrands.com https://*.hubspot.com https://*.vercel.app` | Controls which domains can embed the app in iframes — prevents clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer information leaked to external sites |

These headers are applied to every route (`/(.*)`), covering all pages and API endpoints.

---

## 4. Input Validation & Sanitization

### Zod Schema Validation (Runtime Type Checking)

Every API route validates incoming data with strict **Zod schemas** before processing:

- **`VisualizationRequestSchema`** — Validates image data (minimum length, allowed MIME types: JPEG, PNG, WebP only), prompt length (10–10,000 chars), optional product configuration enums, and UUID format for fingerprints.
- **`ValidationRequestSchema`** — Validates image data and MIME types for the image validation endpoint.
- **`LeadSubmissionSchema`** — Validates name (1–100 chars), email format, phone (10–20 digits), zip code (5–10 chars), and all optional fields.

Any request failing schema validation receives a `400 Bad Request` with specific error details. Invalid requests never reach business logic or external services.

### Dual Validation Layer

The lead submission route applies **two layers of validation**:
1. Zod schema validation (runtime type safety)
2. Business validation via `validateLeadData()` — regex-based email, US zip code, and phone number format checks

### File Name Sanitization

Uploaded file names are sanitized with: `fileName.replace(/[^a-zA-Z0-9.-]/g, '_')` — stripping any characters that could enable path traversal or injection in storage paths.

### Allowed Image Types

Only `image/jpeg`, `image/jpg`, `image/png`, and `image/webp` MIME types are accepted. HEIC/HEIF files are converted client-side before upload.

### Request Size Limits

Server actions are limited to a **3MB body size** (`experimental.serverActions.bodySizeLimit: '3mb'` in Next.js config), preventing oversized payloads.

---

## 5. API Security & Rate Limiting

### Monthly Generation Limits

Anonymous users are rate-limited to **10 AI visualizations per month**, enforced server-side:

- Rate limit records are stored in the `rate_limits` table with `user_fingerprint` and `ip_address`.
- The server checks `getMonthlyUsageCount()` before allowing generation. If the limit is reached, a `429 Too Many Requests` response is returned.
- Authenticated team members bypass rate limits (verified server-side via `getTeamLocation()` check).

### Server-Side API Key Isolation

All external API keys (`GEMINI_API_KEY`, `SUPABASE_SERVICE_KEY`) are only used server-side in Route Handlers. They are **never exposed to the client**. Only `NEXT_PUBLIC_` prefixed variables (Supabase URL and publishable/anon key) reach the browser — these are designed to be public.

### Error Handling

API routes use try/catch blocks that:
- Return generic error messages to clients (e.g., "Server configuration error") without leaking internal details
- Log detailed error information server-side only via `console.error`
- Return appropriate HTTP status codes (400, 401, 403, 429, 500)

---

## 6. Data Storage & Encryption

### Encryption in Transit

- All traffic is served over **HTTPS/TLS** (enforced by Vercel's edge network).
- Supabase connections use TLS for all database, auth, and storage operations.
- Google Gemini API calls are made over HTTPS.

### Encryption at Rest

- Supabase PostgreSQL databases are encrypted at rest (provided by Supabase's infrastructure on Google Cloud Platform).
- Supabase Storage objects are stored on encrypted infrastructure.

### Storage Bucket Separation

Images are stored in two separate Supabase Storage buckets:

| Bucket | Access | Contents |
|--------|--------|----------|
| `visualizations_private` | Private | Original (unwatermarked) generated images |
| `visualizations` | Public | Watermarked versions only |

Only watermarked images are accessible via public URLs. Original unwatermarked images are stored in the private bucket.

### Database Access Pattern

- **Server-side routes** use the `SUPABASE_SERVICE_KEY` (service role) for database operations — this bypasses Row Level Security but is only used in controlled, server-side code paths.
- **Client-side** uses only the publishable key via `@supabase/ssr`, which is limited to auth operations (session management).
- The browser **never** directly reads from or writes to database tables.

---

## 7. Image Handling & Content Safety

### AI-Powered Image Validation

Before any visualization is generated, uploaded images are validated by **Google Gemini**:

- Images are checked for **bathroom/shower suitability**
- Images containing **people or faces are rejected** — the system actively screens for this
- **Content safety flags** are checked: if Gemini flags content as anything other than "safe," a warning is logged and appropriate responses are returned
- **Shower shape detection** (standard, neo-angle, tub) is performed to enforce product configuration rules

### Accepted Formats

The file input only accepts: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`. HEIC/HEIF are converted to JPEG client-side (via `heic2any`) before server transmission.

### No Permanent Storage of Raw Uploads

User-uploaded bathroom and inspiration photos are:
1. Transmitted to the server as base64
2. Sent to Google Gemini for processing
3. **Not stored** in our database or file storage after the session (only the AI-generated result is stored)

The only stored images are the AI-generated visualizations (watermarked in the public bucket, originals in the private bucket).

---

## 8. Secret & Key Management

### Environment Variable Segmentation

| Variable | Scope | Sensitivity |
|----------|-------|------------|
| `GEMINI_API_KEY` | Server only | High — grants AI generation access |
| `SUPABASE_SERVICE_KEY` | Server only | High — full database/storage access |
| `SUPABASE_URL` | Server only | Medium — internal service URL |
| `CRON_SECRET` | Server only | Medium — protects cron endpoint |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Low — designed to be public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client + Server | Low — designed to be public (anon key) |

### Key Principles

- **No secrets in client code:** Only `NEXT_PUBLIC_` prefixed variables are included in the client bundle. All sensitive keys are server-only.
- **Fail-closed on missing config:** Every API route checks for required environment variables and returns `500 Server configuration error` if any are missing — the system does not operate in a degraded/insecure state.
- **`.env` files are gitignored:** The repository includes only `.env.example` with placeholder values, never actual secrets.

---

## 9. Session Management

### Supabase SSR Session Handling

- Authentication sessions are managed by `@supabase/ssr` with **HTTP-only cookies**.
- The **middleware** (`middleware.ts`) runs on every non-static request and calls `supabase.auth.getUser()` to keep session cookies in sync — this ensures expired tokens are refreshed automatically.
- **PKCE (Proof Key for Code Exchange)** is used for the magic link OTP flow, storing `code_verifier` cookies in the browser for secure token exchange.

### Middleware Scope

The middleware matcher excludes static assets (`_next/static`, `_next/image`, favicon, images) from session processing for performance, while covering all dynamic routes.

---

## 10. Data Retention & Automated Cleanup

### Image Expiry System

- Every saved visualization receives an `expires_at` timestamp (approximately **30 days** from creation).
- A **Vercel cron job** runs daily at 3:00 AM UTC, hitting `/api/cron/cleanup-images`.
- The cron job:
  1. Queries for `visualizations` rows where `expires_at < now()` and `visualization_image_url IS NOT NULL`
  2. Deletes the watermarked image from Supabase Storage
  3. Nulls out the `visualization_image_url` in the database
  4. Processes in batches of 50 to avoid timeout

### Image Retention on Lead Submission

When a user submits a lead form, `retainVisualizationImages()` clears the `expires_at` on associated visualizations and marks `images_retained = true` on the lead — preserving images needed for the franchise consultation.

### Lead Data Retention

Lead contact information is retained as needed for business operations and legal compliance (TCPA records, franchise referrals).

---

## 11. TCPA Compliance & Consent Evidence

When a user provides a phone number (required for quote requests, optional for saves), the system collects and stores comprehensive consent evidence:

| Evidence Field | Source | Storage Column |
|---------------|--------|---------------|
| Consent granted | Checkbox UI | `leads.tcpa_consent` (boolean) |
| Consent timestamp | Server-side | `leads.tcpa_consent_at` (timestamptz) |
| Exact consent text shown | Hardcoded constant | `leads.tcpa_consent_text` |
| User's IP address | `x-forwarded-for` / `x-real-ip` header | `leads.consent_ip` |
| User's browser user agent | `navigator.userAgent` | `leads.consent_user_agent` |

**Consent text displayed:** *"I agree to receive calls and/or text messages from Gatsby Glass and its local franchisees at the phone number provided. I understand that consent is not a condition of purchase. Message & data rates may apply. Reply STOP to opt out at any time."*

This evidence chain meets TCPA documentation requirements by recording who consented, when, to what, and from where.

---

## 12. Privacy & Legal Compliance

### In-App Legal Documents

The application includes comprehensive, in-app legal documents accessible via scrollable modal popups:

- **Privacy Policy** — Covers all data collection, AI disclosure, third-party sharing, data retention, TCPA compliance, and state privacy rights (CCPA/CPRA, VCDPA, CPA, CTDPA, UCPA).
- **Terms of Use** — Covers service description, AI disclaimer, acceptable use, intellectual property, liability limitations, indemnification, and governing law.

Both documents are accessible from:
- The site-wide **footer** (visible on every page)
- The **contact/lead form** modal
- The **photo upload** step

### State Privacy Law Coverage

The Privacy Policy addresses rights for residents of:
- **California** (CCPA/CPRA) — Right to know, delete, correct, opt-out of sale/sharing, non-discrimination
- **Virginia** (VCDPA) — Access, delete, correct, opt-out of targeted advertising
- **Colorado** (CPA) — Access, correct, delete, portable copy, opt-out
- **Connecticut** (CTDPA) — Access, correct, delete, portable copy, opt-out
- **Utah** (UCPA) — Access, delete, opt-out of sale
- **Other states** — Catch-all provision to honor applicable state privacy laws

### No Data Sales

The application does not sell personal information to third parties. This is stated explicitly in the Privacy Policy and in the lead form disclosure.

---

## 13. Intellectual Property Protection

### Watermarking System

All AI-generated visualization images served to public/anonymous users are **watermarked** before delivery:

- A semi-transparent Gatsby Glass logo watermark is composited over the center of the image using the **Sharp** image processing library.
- The watermark covers approximately 70% of the image area at ~15% opacity — visible enough to protect IP, subtle enough to still show the visualization.
- **Original (unwatermarked) images** are stored in the **private** storage bucket, inaccessible via public URLs.
- **Watermarked images** are stored in the **public** storage bucket and returned to clients.

### Storage Path Obfuscation

Storage file paths are prefixed with Unix timestamps (`${Date.now()}_${sanitizedFileName}`), making URLs non-guessable and preventing enumeration attacks.

---

## 14. Third-Party Service Security

### Google Gemini

- API calls are made exclusively **server-side** — the API key never reaches the browser.
- Only image data and text prompts are sent; no personal information (name, email, phone) is transmitted to Google.
- Google's own data retention and processing policies apply to transmitted images.

### Supabase

- **Service role key** (full access) is used only in server-side Route Handlers.
- **Publishable key** (limited access) is used in the browser for auth operations only.
- Database operations from the client go through our API routes, not directly to Supabase.
- Supabase provides its own infrastructure security (encrypted at rest, encrypted in transit, SOC 2 compliance).

### Vercel

- Provides automatic **HTTPS** with Let's Encrypt certificates.
- **Edge network** with built-in DDoS protection.
- Serverless functions run in isolated environments.
- Environment variables are encrypted at rest in Vercel's systems.

---

## 15. Deployment & Infrastructure Security

### Vercel Deployment

- Application is deployed on **Vercel's serverless platform**.
- Each deployment is **immutable** — previous versions can be rolled back.
- Environment variables are configured in the Vercel dashboard, not in code.
- Build output does not include server-side environment variables.

### Monorepo Structure

The pnpm monorepo isolates concerns:

| Package | Purpose | Security Relevance |
|---------|---------|-------------------|
| `apps/gatsby-glass` | Next.js app (routes, UI) | Client-facing surface area |
| `packages/api-handlers` | Supabase & Gemini integrations | All external service calls, isolated from client |
| `packages/prompt-templates` | AI prompt management | Prompts are server-side only |
| `packages/types` | Shared TypeScript types | Type safety across boundaries |
| `packages/visualizer-core` | Shared UI hooks/utilities | Client-side only |

---

## 16. File Upload Security

### Upload Restrictions

- **MIME type allowlist:** Only JPEG, PNG, and WebP are accepted by the server (Zod schema enforced).
- **Size limit:** 10MB maximum per image (validated client-side), plus 3MB server action body limit.
- **No executable uploads:** Only image MIME types are processed; no HTML, JavaScript, or other executable content is accepted.
- **Base64 encoding:** Images are transmitted as base64 data URLs, not as raw file uploads, preventing multipart form-data injection attacks.
- **Upsert disabled:** Storage uploads use `upsert: false`, preventing overwriting of existing files.

### Processing Pipeline

1. Client converts file to base64 → sends to `/api/validate-image`
2. Server validates schema → sends to Gemini for content validation
3. If valid, client sends to `/api/generate-visualization`
4. Server generates AI image → applies watermark → uploads to storage
5. Client receives watermarked image only

---

## 17. Cron Job Security

The `/api/cron/cleanup-images` endpoint is protected by an optional `CRON_SECRET`:

- When `CRON_SECRET` is set, the endpoint requires `Authorization: Bearer <CRON_SECRET>` header.
- Vercel's cron system automatically includes this secret when configured.
- The endpoint only performs cleanup operations (delete expired images, null URLs) — no destructive or data-exposing operations.

---

## 18. Client-Side Security

### No Direct External API Calls

The browser only communicates with same-origin Next.js API routes (`/api/*`). It never directly contacts:
- Google Gemini
- Supabase database/storage (except for auth cookie management via `@supabase/ssr`)
- Any other external API

### Local Storage Usage

Only one value is stored in `localStorage`: `hpb_user_id` (a random UUID). This contains no personal information and is used solely for:
- Linking visualization history across page refreshes
- Enforcing rate limits

### No Analytics or Tracking

The application does not include:
- Google Analytics or any analytics SDK
- Advertising pixels or trackers
- Third-party tracking scripts
- Fingerprinting libraries (the "fingerprint" is a simple random UUID, not browser fingerprinting)

### Content Security

The `frame-ancestors` CSP directive prevents the application from being embedded in unauthorized iframes, protecting against clickjacking attacks.

---

## 19. Known Considerations & Future Improvements

The following items represent areas for potential future enhancement:

| Item | Current State | Risk Level | Recommendation |
|------|--------------|------------|---------------|
| Self-service data deletion | Contact-based process via email | Low | Consider adding a user-facing "delete my data" flow |
| Full CSP policy | Only `frame-ancestors` is set | Low | Consider adding `default-src`, `script-src`, `style-src` directives |
| HSTS header | Relies on Vercel's default HTTPS | Low | Consider adding explicit `Strict-Transport-Security` header |
| Cookie consent banner | Not present (only functional cookies used) | Low | Consider adding for extra compliance margin |
| API route authentication | Public routes validate input but don't require auth | Medium | Consider adding request signing or CSRF tokens for write endpoints |
| RLS policies | Service role bypasses RLS; access controlled at app level | Low | Consider adding RLS as defense-in-depth |

---

*This document should be reviewed and updated whenever significant changes are made to the application's security posture, data collection practices, or third-party integrations.*
