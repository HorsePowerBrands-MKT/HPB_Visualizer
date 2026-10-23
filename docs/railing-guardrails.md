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
- **Coverage** (`HANDRAIL_COVERAGE_RULES`) — a top- or side-mounted rail runs
  along every glass run in the render: every side of a deck or balcony,
  every return, the stair flight and the landing. A run missing its rail is
  a failed render. The exterior deck placement rule repeats this for the
  front run, both side returns and any stair edge.

## Finish

The selected finish is applied to every visible piece of hardware: shoe or
spigots, rail, standoffs, clamps, connectors, gate hinges and latch. One finish
only. An explicit selection overrides any finish in an inspiration photo.

## Pool setback (pool application, no existing fence)

`POOL_SETBACK_RULES`: at least 4 ft (about 1.2 m) of clear deck between the
glass and the coping on every side, never on the coping, the first row of
deck beside it, or over the water. Where the hardscape is narrower than
4 ft, the glass follows the outer boundary of the hardscape instead. With an
existing fence the enclosure stays on the fence line and no setback rule is
rendered.

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

## Match Inspiration fallbacks (no explicit selection)

When the consumer leaves handrail or finish as "Match photo", the prompt
renders an explicit mapping instead of a bare "match input_2":

- **Handrail** (`INSPIRATION_HANDRAIL_MAPPING`) — any separate graspable bar
  on the glass face → Side-Mounted; a channel on the top edge → Top-Mounted;
  a bare edge → No Handrail. A cap rail is never substituted for a true
  handrail (B06), and the coverage rule applies.
- **Finish** (`INSPIRATION_FINISH_MAPPING`) — silver / grey / nickel / chrome /
  satin → Brushed Stainless; mirror-bright silver → Polished Stainless;
  black / charcoal / gunmetal / dark bronze → Matte Black. Brass, gold,
  copper, bronze, wood and painted colors map to the nearest approved finish.
  The model is told not to default to black.

## Where the rules are enforced

1. **Types** — `RailingSystem`, `RailingHandrail`, `RailingFinish` only admit
   approved ids, so the UI cannot offer anything else.
2. **Validation** — `validateRailingSelections(payload)` rejects unknown ids,
   missing selections on Design Your Own, and incompatible combinations.
3. **Prompt assembly** — `buildRailingPrompt` calls
   `assertRailingSelectionsRenderable` and throws `RailingRuleViolationError`.
4. **Prompt text** — the hard-lock sections, the NOT APPROVED list and the
   self-check (items 3, 6, 7) tell the model what a failed render is.
