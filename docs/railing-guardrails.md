# Railing Module — compatibility and guardrail rules

Source of truth in code: `apps/gatsby-glass/lib/railing/rules.ts`. The prompt
template (`prompts/railing-templates.ts`) renders its system, handrail, finish,
pool-gate and unsupported-type sections from that file, and
`buildRailingPrompt` refuses to assemble a prompt for any selection outside the
approved families. Both consumer paths (Design Your Own, Match Inspiration) go
through the same rules.

Run the acceptance checks: `pnpm --filter gatsby-glass check:railing-rules`.

## Approved families

| Dimension | Approved values |
|---|---|
| Railing system | Base Shoe, Spigot |
| Handrail | Top-Mounted cap rail, Side-Mounted rail, No Handrail |
| Finish | Matte Black, Brushed Stainless, Polished Stainless |

Every system supports every handrail (`SYSTEM_HANDRAIL_COMPATIBILITY`). Change
the matrix there if a combination is ever withdrawn.

## System behavior

**Base Shoe** — one continuous low-profile channel along the railing line; the
bottom edge of every panel enters it. Hard lock: any spigot, post, clamp or
vertical frame in a fixed run is a failed render. Proportions: about 2–2.5 in
tall and 2.5 in wide, sitting on the floor, never a curb, step or planter.

**Spigot** — individual compact clamps, two per panel, glass floating 3–4 in
above the floor. Hard lock: any continuous channel, base shoe, post or vertical
frame is a failed render. Proportions: about 5 in tall, no taller than a
coffee mug.

## Handrail behavior

- **Top-Mounted** — a thin square cap channel (~1 in) seated on the glass edge.
  No second rail on the face; the edge is never exposed above the cap.
- **Side-Mounted** — a slim bar (~1.5 in) on small standoff pins ~2 in off the
  glass face, 3–4 in below the edge. No cap rail on top.
- **No Handrail** — clean polished glass edge; no rail, cap or channel of any
  kind except gate hardware.

## Finish

The selected finish is applied to every visible piece of hardware: shoe or
spigots, rail, standoffs, clamps, connectors, gate hinges and latch. One finish
only. An explicit selection overrides any finish in an inspiration photo.

## Pool gate (pool application only)

Every pool render includes at least one operable gate at a logical approach,
with hinges and latch in the selected finish. Base Shoe: the shoe is interrupted
at the gate opening. Spigot: no spigot beneath the gate panel; gate-specific
hinges/latch. If the system comes from the inspiration photo: no fixed support
of any kind beneath the gate.

## Existing railing replacement

When the photo shows an existing railing or guard, only that system is removed
and the new glass follows the same railing location, stair slope, landing
geometry, balcony edge or deck perimeter. Supporting architecture is preserved
and the railing never extends onto adjacent walls.

## Unsupported railing types (never rendered)

Cable rail / wire rope; picket, baluster or spindle rail; framed-post systems
(posts between panels, posts with glass clamps, round tube rails on posts);
horizontal bar rail; wood, composite or vinyl rail; framed or tinted glass;
mixing base shoe and spigots in one run.

On the Match Inspiration path an inspiration photo of any of these is mapped to
an approved system (`UNSUPPORTED_RAILING_TYPES[].mapsTo`): cable → spigot,
everything else → base shoe. The consumer's explicit selections always win
over the inspiration photo.

## Where the rules are enforced

1. **Types** — `RailingSystem`, `RailingHandrail`, `RailingFinish` only admit
   approved ids, so the UI cannot offer anything else.
2. **Validation** — `validateRailingSelections(payload)` rejects unknown ids,
   missing selections on Design Your Own, and incompatible combinations.
3. **Prompt assembly** — `buildRailingPrompt` calls
   `assertRailingSelectionsRenderable` and throws `RailingRuleViolationError`.
4. **Prompt text** — the hard-lock sections, the NOT APPROVED list and the
   self-check (items 3, 6, 7) tell the model what a failed render is.
