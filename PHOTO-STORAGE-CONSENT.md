# Photo Storage & Consent Implementation

## Context

The GatsbyView visualizer (`hpb-visualizer-gatsby-glass.vercel.app`) lets users upload a bathroom photo, configure enclosure/framing/hardware options, and generate an AI before/after visualization. We need to add consent-driven photo storage so the marketing/social team can cherry-pick before/after images for social media and the website.

---

## Current App Flow (5 Steps)

1. **Choose Design Method** — "Design Your Own" or "Match Inspiration"
2. **Upload Bathroom Photo** — Drag-and-drop upload zone
3. **Select Enclosure Type** — Hinged / Pivot / Sliding (with direction & ceiling options)
4. **Framing, Hardware & Handles** — Framing style, hardware finish, handle style
5. **Results** — AI-generated before/after with configuration summary + CTAs

---

## Existing Disclaimers (What Changes)

### Upload Page (Step 2) — REPLACE

**Current text (below the upload zone, in gold/red):**
> "Your uploaded photo is **not stored** — it is processed by an AI service to generate your visualization and is discarded after your session. Do not upload images containing visible people or personal information. See our Privacy Policy for details on how your data is used and your rights."

**This must be replaced.** It directly contradicts the new storage behavior. See Section 2 below for the replacement.

### Results Page (Step 5) — KEEP AS-IS

**Current text (below the before/after image):**
> "This visualization is AI-generated and intended for illustrative purposes only. Actual product appearance, dimensions, and finish may vary. Final specifications will be confirmed by your local Gatsby Glass professional."

> "Your generated visualization is available for 30 days. Request a quote to have it shared with your local Gatsby Glass professional."

**No changes needed.** The 30-day retention note already aligns with the new storage window.

---

## Requirements

### 1. Consent Checkboxes (Upload Page — Step 2)

Add two checkboxes below the upload dropzone, above the disclaimer text. They should appear **after the user selects/drops a file** (not before — don't clutter the empty upload state). Both checkboxes must be visible and interacted with before the user can proceed to Step 3.

**Checkbox 1 — Upload & Storage Consent (Required)**

Label:
> ☐ I confirm that I own this image or have permission to use it, and I consent to its use for AI-generated visualizations.

- **Required** to proceed. The "Continue" button stays disabled until this is checked.
- When checked, the original uploaded photo is persisted to Supabase Storage.

**Checkbox 2 — Marketing Use Consent (Optional)**

Label:
> ☐ I consent to Gatsby Glass using my before/after images for marketing purposes, including social media and website content.

- **Optional.** Value stored as a boolean flag on the database record.
- Does NOT affect whether images are stored — only controls whether the marketing team can access/use them.

### 2. Updated Disclaimer (Upload Page — Step 2)

**Replace** the existing red/gold disclaimer text with the following. Same position (below the upload zone and checkboxes), same styling:

> By uploading this image, you represent that you have the legal right to use and submit it. You acknowledge that the image will be processed by an AI service to generate visualizations. Uploaded images are retained for up to 30 days and then permanently deleted. Do not upload images containing visible people, personal information, illegal or inappropriate content, or content you do not have permission to use. See our [Privacy Policy] for details on how your data is used and your rights.

Key differences from the old text:
- Removes "Your uploaded photo is **not stored**" (no longer true)
- Adds "retained for up to 30 days and then permanently deleted"
- Keeps the Privacy Policy link
- Keeps the prohibition on images of people / personal info

### 3. Upload Page State Machine & Logic

The upload page (Step 2) has multiple visual states. Here is exactly what renders in each state and the conditions that govern transitions.

#### State A: Empty (no file selected)

This is the current default state — the drag-and-drop zone with "Click to upload or drag & drop."

| Element | Visible? |
|---|---|
| Upload dropzone | ✅ |
| Checkbox 1 (Upload Consent) | ❌ Hidden |
| Checkbox 2 (Marketing Consent) | ❌ Hidden |
| Disclaimer text | ✅ — Show the **new** disclaimer text (see Section 2). It replaces the old "not stored" text. The disclaimer is always visible regardless of upload state so the user knows the policy before they even drop a file. |
| "Continue →" button | Disabled (greyed out, as it is currently) |

#### State B: File selected / preview shown

User has dropped or selected a photo. The image preview appears in the upload zone.

| Element | Visible? |
|---|---|
| Upload dropzone (with image preview) | ✅ |
| Checkbox 1 (Upload Consent) | ✅ — Appears below preview, above disclaimer |
| Checkbox 2 (Marketing Consent) | ✅ — Appears below Checkbox 1 |
| Disclaimer text | ✅ — Same new disclaimer text, now below the checkboxes |
| "Continue →" button | **Disabled** until Checkbox 1 is checked |

#### State B → Continue transition

| Condition | Result |
|---|---|
| Checkbox 1 ❌ unchecked | "Continue →" button stays disabled. No tooltip or error needed — the required nature is implied by the checkbox label and the disabled button. |
| Checkbox 1 ✅ checked, Checkbox 2 ❌ | "Continue →" enabled. User can proceed. `marketing_consent = false`. |
| Checkbox 1 ✅ checked, Checkbox 2 ✅ | "Continue →" enabled. User can proceed. `marketing_consent = true`. |

#### Reset behavior

If the user removes the selected file (clicks an "X" or re-enters the dropzone), revert to State A: hide both checkboxes and reset both to unchecked.

If the user navigates back to Step 2 from Step 3 ("← Back"), restore the previously selected file AND the previously checked consent values. Do not force them to re-check.

### 4. Consent State Through the Flow

The consent checkbox values must persist through Steps 2 → 5 in the app's state (React state, context, or whatever state management the app uses). They are needed at two points downstream:

**Point 1 — When the user clicks "Generate Preview" (Step 4 → Processing)**

At this moment, the app should:
1. Upload the original photo to Supabase Storage (`visualizer-uploads` bucket)
2. Insert a row into `visualizer_submissions` with:
   - `original_photo_path` = the storage path
   - `upload_consent` = `true` (always, since it was required)
   - `marketing_consent` = value of Checkbox 2 from Step 2
   - `metadata` = JSON of the user's configuration selections (enclosure type, framing, hardware finish, handle style)
   - `generated_image_path` = `null` (not yet available)
3. Send the photo to the AI pipeline for visualization (existing behavior)
4. Store the `visualizer_submissions` row ID in state so it can be updated after generation

**Point 2 — When AI generation completes (Processing → Results / Step 5)**

At this moment, the app should:
1. Upload the AI-generated image to Supabase Storage (`visualizer-results` bucket)
2. Update the existing `visualizer_submissions` row (by ID from Point 1) with `generated_image_path`

**Error handling:** If the AI generation fails, the `visualizer_submissions` row will have `generated_image_path = null`. The purge cycle will clean it up after 30 days. The admin UI should handle this gracefully (show "Generation failed" or filter out rows with null generated images).

### 5. Storage Behavior Summary

| Scenario | Original Photo | AI-Generated Image | `marketing_consent` |
|---|---|---|---|
| Checkbox 1 ✅ only | ✅ Stored (30 days) | ✅ Stored (30 days) | `false` |
| Checkbox 1 ✅ + Checkbox 2 ✅ | ✅ Stored (30 days) | ✅ Stored (30 days) | `true` |
| Checkbox 1 ❌ | ❌ Cannot proceed | ❌ Nothing generated | N/A |

- **Original photos** → Supabase Storage bucket (e.g., `visualizer-uploads`)
- **AI-generated images** → separate bucket or path (e.g., `visualizer-results`)
- Both reference a shared record in the database

### 6. Database Schema

Add a table (or extend existing) to track visualizer submissions:

```sql
create table visualizer_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  original_photo_path text not null,
  generated_image_path text,
  upload_consent boolean not null default true,
  marketing_consent boolean not null default false,
  source_url text,              -- page URL where the upload originated
  metadata jsonb default '{}'   -- enclosure type, framing, hardware, handle selections
);
```

- `expires_at` drives the purge cycle (30 days from creation).
- `marketing_consent` is the filter field for the admin UI.
- `upload_consent` will always be `true` in practice (required to proceed), but store explicitly for audit trail.
- `metadata` should capture the user's configuration selections (enclosure type, framing style, hardware finish, handle style) so the marketing team has context for each before/after pair.

### 7. 30-Day Purge Cycle

Automated daily cleanup via Supabase Edge Function (preferred) or pg_cron:

1. Query all rows where `expires_at <= now()`
2. Delete corresponding files from Supabase Storage (`original_photo_path` and `generated_image_path`)
3. Delete the database row

```sql
-- Query for the purge job
select id, original_photo_path, generated_image_path
from visualizer_submissions
where expires_at <= now();
```

**Important:** Storage file deletion requires the Supabase Storage API, not raw SQL. The scheduled job should be an Edge Function that:
1. Queries expired rows
2. Calls `supabase.storage.from('bucket').remove([paths])` for each
3. Deletes the database rows

Schedule: once daily (e.g., 3 AM CT).

### 8. Admin UI Updates

Add an admin view/page (or extend the existing admin UI behind "Team Login") for browsing submissions.

**Required features:**

- **Grid view** showing: thumbnail of original photo, thumbnail of AI-generated image, submission date, days remaining until expiration, marketing consent status, configuration metadata (enclosure type, hardware, etc.)
- **Filter toggle:** "Marketing approved only" — filters to `marketing_consent = true`. This should be the **default active filter** for the social/marketing team.
- **Bulk download:** Select multiple before/after pairs and download as a zip.
- **Expiration urgency:** Visual indicator (badge or color) when images are within 7 days of deletion.

**Filter logic:**
```sql
-- Default view for marketing/social team
select * from visualizer_submissions
where marketing_consent = true
  and expires_at > now()
order by created_at desc;

-- Full admin view (all submissions)
select * from visualizer_submissions
where expires_at > now()
order by created_at desc;
```

---

## Implementation Checklist

### Upload Page UI (Step 2)
- [ ] New disclaimer text replaces old "not stored" text — same position, same styling. Visible in **both** empty and file-selected states.
- [ ] Do NOT add a second disclaimer — the new text replaces the old one, not alongside it.
- [ ] When no file is selected (State A): checkboxes are hidden, "Continue →" is disabled.
- [ ] When file is selected (State B): both checkboxes appear between the image preview and the disclaimer.
- [ ] Checkbox 1 is required — "Continue →" stays disabled until checked.
- [ ] Checkbox 2 is optional.
- [ ] If user removes the selected file, revert to State A: hide checkboxes, reset both to unchecked.
- [ ] If user navigates back to Step 2 from Step 3, restore the file preview AND previously checked consent values.

### Consent State Management
- [ ] Store `uploadConsent` (boolean) and `marketingConsent` (boolean) in app state (context, store, or lifted state — whatever the app currently uses for step data).
- [ ] These values must persist from Step 2 through Steps 3, 4, and into the generation/results flow.
- [ ] On "Generate Preview" click (Step 4): read consent values from state and pass to the storage/DB write logic.
- [ ] On AI generation complete: use the stored submission row ID to update with the generated image path.

### Storage & Database
- [ ] Create `visualizer_submissions` table in Supabase (see Section 6 for schema).
- [ ] Configure Supabase Storage buckets (`visualizer-uploads`, `visualizer-results`).
- [ ] On "Generate Preview" (Step 4 → Processing): upload original photo to storage, insert DB row with consent flags + config metadata, store row ID in state, then send to AI pipeline.
- [ ] On AI completion (Processing → Results): upload generated image to storage, update existing DB row with `generated_image_path`.
- [ ] If AI generation fails: leave `generated_image_path` as null. Purge cycle handles cleanup.
- [ ] Set RLS policies: public can insert (via API), only admin/service role can read.

### Admin UI
- [ ] Add submissions grid view (accessible from Team Login / admin area).
- [ ] Default filter: marketing-approved only (`marketing_consent = true`).
- [ ] Handle rows where `generated_image_path` is null (show "Generation failed" or filter out).
- [ ] Bulk download for selected before/after image pairs.
- [ ] Expiration countdown / urgency badge (highlight when < 7 days remaining).

### Purge System
- [ ] Implement daily Edge Function that deletes expired storage files + DB rows.
- [ ] Must use Supabase Storage API for file deletion (not raw SQL).
- [ ] Schedule to run daily (3 AM CT or similar).

### Results Page (Step 5)
- [ ] No disclaimer changes needed — existing text is compatible.

---

## Notes

- The 30-day window is a business decision. Changing it later = one value in `expires_at` default + one line of disclaimer copy.
- AI-generated images are always stored regardless of Checkbox 2. Checkbox 2 only governs whether marketing can use them externally.
- The existing "Your generated visualization is available for 30 days" text on the results page already matches the retention window — no update needed.
- RLS should ensure end users cannot browse other users' submissions. Admin/service role bypasses RLS for the admin UI.
- The `metadata` jsonb column should store the full configuration so the marketing team knows what glass type, hardware finish, etc. is shown in each visualization without needing to guess.
