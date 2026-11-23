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
Marvel", plus cigar rooms and home offices as named uses. The **Grid** style
and the **Dining Room** room type were added in November 2026 at the request
of Gatsby's brand president and brand marketing manager after QA round 1.

## What the consumer picks

| Dimension | Approved values | How it is collected |
|---|---|---|
| Room type | Wine Room, Under-Stair Nook, Home Office, Dining Room, Other Room | Auto-detected from the photo; correctable under the upload and on the result page |
| Enclosure style | Frameless, Framed, Grid | Step 3 (Design Your Own) or taken from the inspiration photo |
| Finish | Matte Black, Brushed Stainless, Polished Stainless, Polished Brass, Satin Brass | Step 3 or from the inspiration photo |
| Placement path | Tap the corners of the glass walls on the photo (two taps = one wall, three = an L); drag for a single wall | Required when the validator finds nothing to anchor to (`open_floor` / `none`); optional otherwise, and then it overrides the inferred opening |

The finish catalog is **shared with the Glass Railing module**:
`apps/gatsby-glass/lib/metal-finishes.ts` holds the ids, consumer copy,
swatches, prompt descriptors and the Match Inspiration color mapping; both
modules re-export it. Change a finish there and both product lines follow.

The door (one swinging glass door, hinged or pivot, at the natural entry) is
backend logic on every render and is never a consumer choice.

## Style behavior

**Frameless** — full-height clear glass sheets held only by small square
clamps (~2 in) in the selected finish, two or three per edge at the floor,
the ceiling (or stair underside) and the walls. **No channel on any edge**:
a continuous channel, track or edge strip is a failed render, because a
metal outline around the glass reads as framed. A fixed transom above the
door is clamped like every other panel. Hairline glass-to-glass joints; a
frameless door on two compact hinges or a pivot pair with a tall pull. Hard
lock: any channel, post, mullion, frame profile or divided-lite grid is a
failed render.

**Framed** — every panel in a slim flat metal frame (~1 to 1.5 in profiles):
one perimeter frame plus a vertical mullion at every panel joint and corner
(glass never meets glass), a door framed on all four sides, and a head
member over the door when there is a transom. Hard lock: a bare glass edge,
glass-to-glass joints, an outline-only frame, heavy storefront framing,
wood, or a grid of small panes is a failed render (a grid is the separate
Grid style).

**Grid** — the framed system (slim perimeter frame, a mullion at every
joint, a door framed on all four sides) plus flat metal grid bars of the
same ~1 to 1.5 in width dividing every panel **and the door** into one
regular grid of tall rectangular panes (~1.5 to 2.5 ft wide, ~2 to 3 ft
tall, so three or four rows on a full-height panel). The horizontal bars sit
at the same heights everywhere so each grid line runs level across the
whole enclosure; a transom over the door carries the grid too. Hard lock: a
panel or door without the grid, mismatched or misaligned grids, diamond /
arched / colonial / wood / white or snap-in grilles, storefront or wood
framing, or obscured glass is a failed render.

All three style descriptors in `catalog.ts` (`promptDescriptor`) say the same
thing; the rule check fails if the frameless prompt mentions a U-channel.

## Glass and door

- `GLASS_RULES` — clear low-iron look, no tint/frost/reeding; full height
  with no gap at the floor or ceiling; closes the entire open side(s) of the
  space tight to the walls.
- `DOOR_RULES` — exactly one operable swinging glass door (a pair only for
  openings wider than ~8 ft), same style and finish; never a sliding,
  bypass, barn, pocket or folding door. **Hinge side vs handle side:** all
  hinges (or the pivot pair) on one vertical edge, the handle on the other,
  nothing else on the handle edge (self-check 4b). **Size:** a walk-through
  door about 36 in wide (never under ~30 in), full height, or 7–8 ft with a
  transom under a tall or sloped ceiling. `STYLE_RULES[style].door` adds the
  style-specific hardware.

## Room-type placement

- **Wine room** — glass at the threshold of the storage area; racks and
  bottles stay behind it exactly as photographed; never add racks.
- **Under-stair** — the top edge is raked to follow the stair underside; the
  stair itself (treads, risers, stringers, handrail) is never moved; no glass
  on the treads. Self-check item 5c restates this.
- **Home office** — full-height glass wall across the open side, door at the
  natural entry, desk and equipment unchanged.
- **Dining room** — full-height glass wall across the open side or doorway,
  door at the entry from the adjoining room; table, chairs, sideboard, rug
  and light fixture stay inside and visible. The glass never runs through or
  in front of the furniture. The validator detects `dining_room` when a
  dining table with chairs is the main subject.
- **Other room** — generic full-height wall and door across the opening.

## Existing condition (automatic from the photo)

Detected by the validator and hidden from the consumer:

| Value | Rule |
|---|---|
| `open_opening` | Add the enclosure across the opening using its own edges as the anchor |
| `existing_partition` | Remove only that partition/door and fill the same opening |
| `existing_glass` | Replace the existing glass along the same line |
| `open_floor` | Nothing frames the area (racks, a desk or a corner in open floor): create the room with a new glass wall on every segment of the customer placement path |
| `none` | Use the placement path if present, otherwise infer the single most logical opening and treat it as open |

A plain room is always a valid upload: the validator is told never to
reject an interior photo for lacking a staircase, edge, nook or opening,
because an enclosure usually *creates* a room rather than replacing
something.

## Placement path (where the glass goes when nothing anchors it)

Showers and railings replace something already in the photo; an enclosure
often has nothing to replace and usually needs more than one wall (an L or
a U of glass against existing walls). The consumer shows us the footprint
by tapping the corners on their photo.

- **UI** — `PlacementLineOverlay` sits over the upload preview. Each tap
  adds a corner: two taps are one wall, three an L-shaped room, four a U.
  A drag is a shortcut for a single wall. Points are stored in image
  coordinates (0..1 of the uploaded photo, so display size and compression
  don't matter). The banner says whether the path is required
  (`requiresPlacementPath`: `open_floor`, `none`, or no validation yet) or
  optional, and a half-drawn path (one corner) never counts
  (`isPlacementPathComplete`). Segments shorter than 3% of the image are
  ignored; "Undo corner" and "Clear" edit it; a new photo resets it.
  On screen the path is brand light gold (`#e4bf6e`, dark halo); that color
  is display-only and never reaches the model.
- **Transport** — at generate time `renderPlacementReferenceImage` burns the
  path in bright magenta (white outline, a dot at every corner) onto a
  black-and-white copy of the photo downscaled to 1280px and sends it as
  `placementImage`. The copy is desaturated so the model cannot mistake it
  for the canvas (QA saw the magenta path copied into an under-stair
  render). The corners are also written into the prompt text
  (`describePlacementCorners` → `placement_corners`, as percentages of the
  photo), so placement doesn't rest on the image alone. The
  API route attaches it as a reference image after input_1 and any
  inspiration photo with `PLACEMENT_REFERENCE_DESCRIPTION` ("placement
  only, never reproduce the path"). The corner coordinates are never stored
  on leads or visualizations; `product_config.placement` records only
  whether a path was drawn (`drawn` | `inferred`).
- **Prompt** — `PLACEMENT_PATH_RULES` render only when a path was drawn:
  each segment is one full-height glass wall standing exactly on it, walls
  meet at a glass corner where segments meet, the area between the path and
  the existing walls becomes the new room, the path overrides any inferred
  opening with no walls added or dropped, ends within a foot of a wall
  close the gap, and the door sits on one of the segments. The glass
  touches the floor exactly at the corner dots, in front of any window on
  the wall beyond, never set back (self-check 8). Segments traced up a wall
  or along a stair underside are the edge of the glass, not extra walls.
  No magenta, pink or purple mark may appear in the output (self-check 9).

**Limitation.** This is still a whole-photo edit with no mask, so the model
can drift off the path on busy scenes. Reference-image placement is the
strongest signal available on the current Gemini path; if QA shows drift,
the next step is region-controlled editing.

## Finish

The selected finish is applied to every visible piece of hardware: frame and
mullions (framed) or clamps (frameless), hinges or pivots, and
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

Decorative or traditional grilles (diamond, arched, colonial, wood or white,
snap-in); a grid on a Framed or Frameless enclosure (a grid appears only
with the Grid style); heavy commercial storefront framing; wood, painted or
vinyl frames; barn-door tracks, bypass sliders, folding doors; tinted,
frosted, reeded or patterned glass; **half-height partitions** (still banned:
every enclosure is full height and there is no height option); mixing styles
in one enclosure.

On the Match Inspiration path an inspiration photo of any of these is mapped
to an approved style (`UNSUPPORTED_ENCLOSURE_TYPES[].mapsTo`): decorative
grilles → Grid; an unselected grid, storefront and wood frames → slim
framed; everything else → frameless. The
consumer's explicit selections always win over the inspiration photo.

## Match Inspiration fallbacks (no explicit selection)

- **Style** (`INSPIRATION_STYLE_MAPPING`) — visible frame profiles and
  mullions → Framed; bare glass edges with clamps or a channel → Frameless
  (rendered with clamps only); a divided-lite, grid, steel-window or
  French-door look → Grid; a storefront look → Framed with slim profiles
  and no grid.
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
   self-check (items 3, 4, 6, 7, 8) tell the model what a failed render is.

## Data and integrations

- `visualizations.product` / `leads.product` store `'room_enclosure'`; the
  columns are free text (migrations 024/025), so no schema change is needed.
  `product_config` carries `{ mode, application, style, finish,
  existing_condition, placement, catalog_version }`.
- Lead `source` is "Gatsby Glass Enclosure Visualizer"; emails swap in
  "glass room enclosure" copy and list Room Type / Enclosure Style / Finish.
- Constant Contact: enclosure leads use the bare SAS / RAQ / POP picklist
  values until matching variants exist; set
  `SHARPSPRING_ROOM_ENCLOSURE_LEAD_SUFFIX` (e.g. `-E`) once they do.
- The wizard's style icons are in `apps/gatsby-glass/public/room-enclosure-icons/`
  (UI only; never sent to the image model). There are no example photos for
  the style guide yet; add `image` to `roomEnclosureStyles` entries when
  Gatsby supplies them.
