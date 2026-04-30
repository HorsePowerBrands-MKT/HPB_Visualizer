# Gatsby Glass Visualizer — Email Copy

Two transactional emails triggered from the visualizer contact form for the visualizer.

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

The `SharedInboxEmailAddress` (stored as `email` in `team_locations`) resolved by the customer's zip code through `territory_zipcodes` → `team_locations`.

**No-territory fallback:** If the zip code does not match any franchise territory, send to `CustomerJourney@horsepowerbrands.com` (the brand-level monitoring inbox from `GATSBY_GLASS_CONFIG.supportEmail`).

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

When a customer's zip code does not match any franchise territory, the `lookupLocationByZipcode` function returns `NO_TERRITORY`. The recommendation is to route RAQ emails for these leads to `CustomerJourney@horsepowerbrands.com` so they are not lost.

### 2. SAS Franchise Notification

Currently both SAS and RAQ leads are pushed to the CRM (Constant Contact / SharpSpring). The franchise location does **not** receive a direct email notification for SAS leads — only for RAQ.

Recommendation: keep franchise notification limited to RAQ only. SAS is a lower-intent action (the customer just wants their image), and sending franchise emails for SAS could create noise. The lead is still visible in the CRM if the franchise wants to follow up.