# Gatsby Glass Visualizer — Email Copy

Transactional emails triggered from the visualizer contact form. A quote (RAQ)
request now sends both a franchise/triage notification and a customer-facing
confirmation.

## Previewing the emails

Run from the repo root (or from `apps/gatsby-glass`):

```bash
pnpm preview:emails
```

This regenerates static HTML previews for every variant by importing the real
renderers from `packages/api-handlers/src/resend.ts`, so what you see is exactly
what Resend will deliver. Output files land in
`apps/gatsby-glass/public/email-preview/`:

| File                     | Email                                              |
| ------------------------ | -------------------------------------------------- |
| `index.html`             | Landing page that links to every variant           |
| `sas-configure.html`     | SAS · customer · configure mode                    |
| `sas-inspiration.html`   | SAS · customer · inspiration mode                  |
| `raq-configure.html`     | RAQ · franchise · configure mode                   |
| `raq-inspiration.html`   | RAQ · franchise · inspiration mode                 |
| `raq-no-territory.html`  | RAQ · outside service area (zip not in any territory) |
| `customer-quote-matched.html` | Customer quote confirmation · territory matched |
| `customer-quote-outside.html` | Customer quote confirmation · outside service area |

Open `email-preview/index.html` directly, or hit
<http://localhost:3000/email-preview/> while `pnpm dev` is running.

## Deployment Prerequisites (SAS email)

The Save & Send to Me (SAS) email is sent through [Resend](https://resend.com).
Before the email will deliver in any environment:

1. **Verify the sender domain** (`gatsbyglass.com`) in the Resend dashboard
  (DNS: SPF, DKIM, and ideally DMARC). Until the domain shows as verified,
   Resend will reject `from: noreply@gatsbyglass.com`.
2. **Set environment variables** on Vercel (and locally in `.env`):
  - `RESEND_API_KEY` — required. The route logs a warning and skips the send
   when this is unset, so the lead still saves successfully.
  - `RESEND_FROM` — optional override of the sender address. Defaults to
  `Gatsby Glass <noreply@gatsbyglass.com>`. Must use a verified domain.
3. The reply-to header is automatically set to `GATSBY_GLASS_CONFIG.supportEmail`
  (`CustomerJourney@horsepowerbrands.com`) so customer replies land in the
   brand monitoring inbox.

The send is fully awaited inside `POST /api/submit-lead` (Vercel terminates
the function after the response, so an unawaited fetch would be killed).
Failures are logged but never surfaced to the user — the success toast in
`ContactFormModal.tsx` only depends on the lead row being saved.

---

## Email 1: Save & Send to Me (SAS)

Sent to the **customer** when they click "Save & Send to Me" and submit the contact form.

### Trigger

`leadType: SAS` via `POST /api/submit-lead`

### Recipient

The customer's email address.

### Available Data


| Field                   | Source                                                                        |
| ----------------------- | ----------------------------------------------------------------------------- |
| `firstName`             | Parsed from `name` (split on first space)                                     |
| `visualizationImageUrl` | `resultUrl` (Supabase Storage URL, expiry cleared on lead submit)             |
| `enclosureType`         | Human-readable from catalog, e.g. "Hinged Door", "Pivot Door", "Sliding Door" |
| `framing`               | Human-readable from catalog, e.g. "Frameless", "Semi-Frameless", "Framed"     |
| `hardware`              | Human-readable from catalog, e.g. "Polished Chrome", "Matte Black"            |
| `handleStyle`           | Human-readable from catalog, e.g. "Ladder Pull", "Square Pull", "Knob"        |
| `mode`                  | "configure" or "inspiration"                                                  |


---

### Subject Line

```
Your Gatsby Glass Shower Visualization
```

### Body

```
Hi {{firstName}},

Thanks for using the Gatsby Glass Visualizer! Here's the custom shower
design you created.

[VISUALIZATION IMAGE]

YOUR SELECTED CONFIGURATION
  Enclosure:  {{enclosureType}}
  Framing:    {{framing}}
  Hardware:   {{hardware}}
  Handle:     {{handleStyle}}

This visualization is AI-generated and intended for illustrative purposes
only. Actual product appearance, dimensions, and finish may vary.

READY TO BRING THIS DESIGN TO LIFE?
A local Gatsby Glass professional can walk you through your options,
take measurements, and provide a detailed quote — all at no cost.

          [ Request a Quote ]
      (link back to gatsbyglass.com)

Your visualization will be available for 30 days.

—
Gatsby Glass
www.gatsbyglass.com

You are receiving this email because you requested your shower
visualization be sent to this address. If you believe this was sent
in error, you can disregard this message.
```

### Notes — Inspiration Mode Variant

When `mode` is "inspiration", the configuration table should be replaced with:

```
YOUR DESIGN
  Based on your uploaded inspiration photo, tailored to your
  bathroom's unique layout.
```

---

## Email 2: Request a Quote (RAQ)

Sent to the **franchise location's shared inbox** when a customer clicks "Request a Quote" and submits the contact form.

### Trigger

`leadType: RAQ` via `POST /api/submit-lead`

### Recipient

The `SharedInboxEmailAddress` (stored as `email` in `team_locations`) resolved by the customer's zip code through `territory_zipcodes` → `team_locations`. Each territory's coverage is expanded by a configurable mileage buffer (Vault secret `territory_radius_miles`, default 10) during the daily sync; when a zip is covered by more than one territory, `lookupLocationByZipcode` routes to whichever franchise is closest (`territory_zipcodes.distance_miles`).

**Outside-territory routing:** If the zip code falls outside every territory (including the buffer), the lead still goes through and the RAQ email is routed to `OUTSIDE_TERRITORY_INBOX` (`ahoebelheinrich@gatsbyglass.com`). The email opens with a notice that the person is outside our service areas, lists the zip they entered and the single nearest franchise (name, distance, inbox via the `nearest_franchise` RPC / `findNearestLocation`), and asks the recipient to forward the full lead details below if that location is close enough to service.

## Email 3: Quote Confirmation (customer)

Sent to the **customer** after a quote (RAQ) submission, in addition to the franchise/triage notification above. Rendered by `sendCustomerQuoteEmail` (`packages/api-handlers/src/resend.ts`).

- **Territory matched:** "We've notified your local Gatsby Glass team — they'll be in touch soon," with the support phone for questions.
- **Outside service area:** Lets the customer know their zip is outside our current service area and points them to the support phone (`(866) 479-2870`, from `GATSBY_GLASS_CONFIG.supportPhone`) and the contact page (`https://www.gatsbyglass.com/contact-us/`, from `GATSBY_GLASS_CONFIG.contactUrl`).

The on-screen confirmation in the quote popup mirrors this: `POST /api/submit-lead` returns `locationMatched` for RAQ leads, and `ContactFormModal` shows the matched ("local team will be in touch") or outside ("call/contact us") message accordingly.

### Available Data


| Field                   | Source                                 |
| ----------------------- | -------------------------------------- |
| `locationName`          | From `team_locations.location_name`    |
| `customerName`          | Full name from the form                |
| `customerEmail`         | Email from the form                    |
| `customerPhone`         | Phone from the form (required for RAQ) |
| `customerZipCode`       | Zip code from the form                 |
| `visualizationImageUrl` | `resultUrl` (Supabase Storage URL)     |
| `enclosureType`         | Human-readable from catalog            |
| `framing`               | Human-readable from catalog            |
| `hardware`              | Human-readable from catalog            |
| `handleStyle`           | Human-readable from catalog            |
| `mode`                  | "configure" or "inspiration"           |
| `submittedAt`           | Timestamp of form submission           |


---

### Subject Line

```
New Visualizer Quote Request — {{customerName}} ({{customerZipCode}})
```

### Body

```
NEW QUOTE REQUEST FROM THE GATSBY GLASS VISUALIZER

A potential customer has requested a quote after designing their
shower in the visualizer.

——————————————————————————————————————

CUSTOMER INFORMATION
  Name:      {{customerName}}
  Email:     {{customerEmail}}
  Phone:     {{customerPhone}}
  Zip Code:  {{customerZipCode}}

CONFIGURATION DETAILS
  Enclosure Type:   {{enclosureType}}
  Framing:          {{framing}}
  Hardware Finish:  {{hardware}}
  Handle Style:     {{handleStyle}}

VISUALIZATION

[VISUALIZATION IMAGE]

——————————————————————————————————————

This lead has also been logged in Constant Contact. Please reach out
to the customer promptly.

Submitted: {{submittedAt}}
```

### Notes — Inspiration Mode Variant

When `mode` is "inspiration", replace the "Configuration Details" section with:

```
DESIGN MODE
  Inspiration-based (customer uploaded a reference photo)
```

---

## Open Decisions

### 1. No-Territory Routing

When a customer's zip code does not match any franchise territory (even after the mileage buffer expansion), `lookupLocationByZipcode` returns `NO_TERRITORY`. These RAQ leads are routed to `OUTSIDE_TERRITORY_INBOX` (`ahoebelheinrich@gatsbyglass.com`) with an "Outside Service Area" notice and the single nearest franchise (resolved via the `nearest_franchise` RPC) so they can be triaged and forwarded rather than lost.

### 2. SAS Franchise Notification

Currently both SAS and RAQ leads are pushed to the CRM (Constant Contact / SharpSpring). The franchise location does **not** receive a direct email notification for SAS leads — only for RAQ.

Recommendation: keep franchise notification limited to RAQ only. SAS is a lower-intent action (the customer just wants their image), and sending franchise emails for SAS could create noise. The lead is still visible in the CRM if the franchise wants to follow up.