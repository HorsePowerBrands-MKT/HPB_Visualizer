# Room Enclosure Module — compatibility and guardrail rules

Source of truth in code: `apps/gatsby-glass/lib/room-enclosure/rules.ts`. The
prompt template (`prompts/room-enclosure-templates.ts`) renders its style,
door, finish, placement and unsupported-type sections from that file, and
`buildRoomEnclosurePrompt` refuses to assemble a prompt for any selection
outside the approved families. Both consumer paths (Design Your Own, Match
Inspiration) go through the same rules.

Run the acceptance checks: `pnpm --filter gatsby-glass check:room-enclosure-rules`.

Product source: Gatsby's [Glass Wine Rooms & Enclosures](https://www.gatsbyglass.com/glass-services/glass-wine-rooms-enclosures/)
page — "Frameless Elegance", "Classic Framed Designs" and the "Under-Stair
Marvel", plus cigar rooms and home offices as named uses.

## What the consumer picks

| Dimension | Approved values | How it is collected |
|---|---|---|
| Room type | Wine Room, Under-Stair Nook, Home Office, Other Room | Auto-detected from the photo; correctable under the upload and on the result page |
| Enclosure style | Frameless, Framed | Step 3 (Design Your Own) or taken from the inspiration photo |
| Finish | Matte Black, Brushed Stainless, Polished Stainless, Polished Brass, Satin Brass | Step 3 or from the inspiration photo |

The finish catalog is **shared with the Glass Railing module**:
`apps/gatsby-glass/lib/metal-finishes.ts` holds the ids, consumer copy,
swatches, prompt descriptors and the Match Inspiration color mapping; both
modules re-export it. Change a finish there and both product lines follow.

The door (one swinging glass door, hinged or pivot, at the natural entry) is
backend logic on every render and is never a consumer choice.

## Style behavior

**Frameless** — full-height clear glass sheets held only by a slim U-channel
(~1 in) at the floor and ceiling (or stair underside) and compact clamps at
the walls; hairline glass-to-glass joints; a frameless door on pivot or
wall-mount hinges with a tall pull. Hard lock: any post, mullion, frame
profile or divided-lite grid is a failed render.

**Framed** — every panel in a slim flat metal frame (~1 to 1.5 in profiles):
one perimeter frame plus thin vertical mullions only at panel joints, and a
matching framed door with a lever or pull. Hard lock: a bare glass edge,
heavy storefront framing, wood, or a grid of small panes is a failed render.

## Glass and door

- `GLASS_RULES` — clear low-iron look, no tint/frost/reeding; full height
  with no gap at the floor or ceiling; closes the entire open side(s) of the
  space tight to the walls.
- `DOOR_RULES` — exactly one operable swinging glass door (a pair only for
  openings wider than ~8 ft), 30–36 in wide, same style and finish; never a
  sliding, bypass, barn, pocket or folding door. `STYLE_RULES[style].door`
  adds the style-specific hardware.

## Room-type placement

- **Wine room** — glass at the threshold of the storage area; racks and
  bottles stay behind it exactly as photographed; never add racks.
- **Under-stair** — the top edge is raked to follow the stair underside; the
  stair itself (treads, risers, stringers, handrail) is never moved; no glass
  on the treads. Self-check item 5c restates this.
- **Home office** — full-height glass wall across the open side, door at the
  natural entry, desk and equipment unchanged.
- **Other room** — generic full-height wall and door across the opening.

## Existing condition (automatic from the photo)

Detected by the validator and hidden from the consumer:

| Value | Rule |
|---|---|
| `open_opening` | Add the enclosure across the opening using its own edges as the anchor |
| `existing_partition` | Remove only that partition/door and fill the same opening |
| `existing_glass` | Replace the existing glass along the same line |
| `none` | Infer the single most logical opening and treat it as open |

## Finish

The selected finish is applied to every visible piece of hardware: frame and
mullions (framed) or channels and clamps (frameless), hinges or pivots, and
the handle. One finish only. An explicit selection overrides any finish in an
inspiration photo.

## Preservation (target opening only)

`PRESERVATION_RULES` and `BACKGROUND_GLASS_PRESERVATION_RULES`: only the
target opening changes. Racks, bottles, furniture, flooring, stairs and
lighting stay as photographed and nothing is added to "furnish" the room.
Every other window, glass door, mirror, shower enclosure or railing in the
photo keeps its material, color and style; it is never recolored to the
selected finish or reframed. Rendered in the user prompt, the system prompt
(B.3) and self-check item 5b.

**Limitations.** Enforced by prompt only; Gemini receives the whole photo
with no mask, so drift is possible on busy scenes with several glass
elements. If it shows up in QA, the next step is a validator-detected target
description or a mask-based edit, not more prompt text.

## Unsupported enclosure types (never rendered)

Divided-lite / French-door / steel-window grids; heavy commercial storefront
framing; wood, painted or vinyl frames; barn-door tracks, bypass sliders,
folding doors; tinted, frosted, reeded or patterned glass; half-height
partitions; mixing framed and frameless panels.

On the Match Inspiration path an inspiration photo of any of these is mapped
to an approved style (`UNSUPPORTED_ENCLOSURE_TYPES[].mapsTo`): grids,
storefront and wood frames → slim framed; everything else → frameless. The
consumer's explicit selections always win over the inspiration photo.

## Match Inspiration fallbacks (no explicit selection)

- **Style** (`INSPIRATION_STYLE_MAPPING`) — visible frame profiles and
  mullions → Framed; bare glass edges with channels/clamps → Frameless; any
  grid, French-door or storefront look → Framed with slim profiles and no
  grid.
- **Finish** (`METAL_FINISH_INSPIRATION_MAPPING`, shared with railing) —
  silver / nickel / chrome / satin → Brushed Stainless; mirror silver →
  Polished Stainless; shiny gold → Polished Brass; brushed gold / champagne →
  Satin Brass; black / charcoal / dark bronze → Matte Black. The model is
  told not to default to black.

## Where the rules are enforced

1. **Types** — `RoomEnclosureStyle`, `RoomEnclosureFinish`,
   `RoomEnclosureApplication` only admit approved ids, so the UI cannot
   offer anything else.
2. **Validation** — `validateRoomEnclosureSelections(payload)` rejects
   unknown ids and missing selections on Design Your Own.
3. **Prompt assembly** — `buildRoomEnclosurePrompt` calls
   `assertRoomEnclosureSelectionsRenderable` and throws
   `RoomEnclosureRuleViolationError`.
4. **Prompt text** — the hard-lock sections, the NOT APPROVED list and the
   self-check (items 3, 4, 6, 7) tell the model what a failed render is.

## Data and integrations

- `visualizations.product` / `leads.product` store `'room_enclosure'`; the
  columns are free text (migrations 024/025), so no schema change is needed.
  `product_config` carries `{ mode, application, style, finish,
  existing_condition, catalog_version }`.
- Lead `source` is "Gatsby Glass Enclosure Visualizer"; emails swap in
  "glass room enclosure" copy and list Room Type / Enclosure Style / Finish.
- Constant Contact: enclosure leads use the bare SAS / RAQ / POP picklist
  values until matching variants exist; set
  `SHARPSPRING_ROOM_ENCLOSURE_LEAD_SUFFIX` (e.g. `-E`) once they do.
- The wizard's style icons are in `apps/gatsby-glass/public/room-enclosure-icons/`
  (UI only; never sent to the image model). There are no example photos for
  the style guide yet; add `image` to `roomEnclosureStyles` entries when
  Gatsby supplies them.
