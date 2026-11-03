{one_line_summary}

## Ticket
https://app.clickup.com/t/1245693/{ticket_id}

## Description of change
{overview_of_ticket_and_issues}

{what_was_discovered}

{how_the_ticket_fixes_the_issues}

{explanation_of_files_touched}

## Type of branch

- [ ] bugfix (Fixes an issue without breaking existing functionality)
- [ ] feature (Adds new functionality without breaking existing code)
- [ ] hotfix (Urgent fix for a critical production issue - branch FROM main TO main)
- [ ] release (Prepares a branch for production release)

## Checklist

- [ ] Merged staging into my branch (or N/A — no staging branch)
- [ ] I have performed a self-review of my own code
- [ ] I have ensured UI changes are responsive across various devices and screen sizes
- [ ] I have commented my code ONLY if the complexity requires it
- [ ] My changes generate no new warnings
- [ ] My code follows the style guidelines of this project
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm run check:docs` pass locally (or CI equivalent)

## Deploy notes

- Vercel deploys **Gatsby Glass** from `apps/gatsby-glass` on merge to the configured production branch.
- Note any new or renamed **environment variables** in Vercel project settings.
- Supabase migrations (if any) must be applied manually — do not auto-run from CI.
