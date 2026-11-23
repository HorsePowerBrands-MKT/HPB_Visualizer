/**
 * Acceptance checks for the room enclosure compatibility / guardrail rules.
 * Assembles real prompts through the production builder and asserts the
 * rules show up (or are blocked) for both consumer paths.
 *
 * Run from apps/gatsby-glass:   pnpm check:room-enclosure-rules
 * (uses npx tsx; no repo dependency added)
 */
import {
  buildRoomEnclosurePrompt,
  buildRoomEnclosurePayload,
  buildRoomEnclosurePromptInput,
  buildRoomEnclosureSystemPrompt,
  getRoomEnclosureValidationPrompt,
  validateRoomEnclosureSelections,
  isRoomEnclosureFormComplete,
  isPlacementPathComplete,
  placementWallCount,
  requiresPlacementPath,
  RoomEnclosureRuleViolationError,
  UNSUPPORTED_ENCLOSURE_TYPES,
  PLACEMENT_REFERENCE_DESCRIPTION,
  describePlacementCorners,
  ROOM_ENCLOSURE_FINISH_ORDER,
  roomEnclosureFinishes,
  roomEnclosureFinishSwatches,
  formatRoomEnclosureSummary,
} from '../lib/room-enclosure';
import { railingFinishes, railingFinishSwatches, RAILING_FINISH_ORDER } from '../lib/railing';
import { roomEnclosureVisualizationTemplate } from '../prompts/room-enclosure-templates';
import type { RoomEnclosureForm, RoomEnclosurePayload } from '../lib/room-enclosure';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? `  — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

const base: RoomEnclosureForm = {
  mode: 'configure',
  application: 'wine_room',
  style: 'frameless',
  finish: 'matte_black',
  existing_condition: 'open_opening',
  application_detected: true,
  placement_path: null,
};
/** An L-shaped room: two glass walls meeting at a corner. */
const LINE = { points: [{ x: 0.1, y: 0.8 }, { x: 0.6, y: 0.78 }, { x: 0.6, y: 0.4 }] };
const prompt = (form: RoomEnclosureForm) =>
  buildRoomEnclosurePrompt(
    buildRoomEnclosurePromptInput(buildRoomEnclosurePayload(form, 'check')!, form.placement_path)
  );
/** Same, without passing the drawn path through (older callers). */
const prompt2 = (form: RoomEnclosureForm) =>
  buildRoomEnclosurePrompt(buildRoomEnclosurePromptInput(buildRoomEnclosurePayload(form, 'check')!));

// --- Finishes are the railing finishes ---------------------------------------
check(
  'finishes: same ids and order as the railing module',
  JSON.stringify(ROOM_ENCLOSURE_FINISH_ORDER) === JSON.stringify(RAILING_FINISH_ORDER)
);
check(
  'finishes: same names, descriptors and swatches as the railing module',
  ROOM_ENCLOSURE_FINISH_ORDER.every(
    (id) =>
      roomEnclosureFinishes[id].name === railingFinishes[id].name &&
      roomEnclosureFinishes[id].promptDescriptor === railingFinishes[id].promptDescriptor &&
      roomEnclosureFinishSwatches[id] === railingFinishSwatches[id]
  )
);
check('finishes: five approved finishes', ROOM_ENCLOSURE_FINISH_ORDER.length === 5);

// --- Frameless behavior -------------------------------------------------------
const fl = prompt(base);
check('frameless: hard style lock rendered', fl.includes('FRAMELESS (hard style lock)'));
check('frameless: held only by small square clamps', fl.includes('held ONLY by small square clamps (clips)'));
check('frameless: no channel on any edge (hard lock)', fl.includes('HARD LOCK: NO channel') && fl.includes('6b. Frameless: is there ANY continuous channel'));
check('frameless: transom above the door is clamped', fl.includes('TRANSOM: where a fixed glass panel sits above the door') && fl.includes('A transom is never left floating'));
check('frameless: no slim-channel wording left', !fl.includes('U-channel') && !fl.includes('slim channel'));
check('frameless: posts / mullions / frames forbidden', fl.includes('if ANY vertical post, mullion, frame profile'));
check('frameless: clamp proportions (~2 in)', fl.includes('CLAMPS: compact square clamps about 2 inches across'));
check('frameless: no framed section rendered', !fl.includes('FRAMED (hard style lock)'));
check('frameless: frameless door hardware', fl.includes('DOOR (frameless)') && fl.includes('tall vertical pull handle'));
check('frameless: no framed door section', !fl.includes('DOOR (framed)'));

// --- Framed behavior ----------------------------------------------------------
const fr = prompt({ ...base, style: 'framed' });
check('framed: hard style lock rendered', fr.includes('FRAMED (hard style lock)'));
check('framed: perimeter frame + mullions', fr.includes('one continuous perimeter frame') && fr.includes('thin vertical mullions'));
check('framed: missing frame / storefront / grid forbidden', fr.includes('if a glass edge is left without its frame'));
check('framed: mullion at every joint, framed door', fr.includes('A vertical mullion stands at EVERY joint') && fr.includes('frame on all four sides'));
check('framed: outline-only / glass-to-glass reads as frameless and fails', fr.includes('the render reads as frameless and FAILS'));
check('framed: transom gets a head member', fr.includes('a horizontal frame member runs across the head of the door'));
check('framed: profile proportions (1–1.5 in)', fr.includes('about 1 to 1.5 inches wide'));
check('framed: mullions only at panel joints, never a grid', fr.includes('MULLIONS: ONLY at panel joints') && fr.includes('Never a grid of small panes'));
check('framed: no frameless section rendered', !fr.includes('FRAMELESS (hard style lock)'));
check('framed: framed door hardware', fr.includes('DOOR (framed)') && !fr.includes('DOOR (frameless)'));

// --- Grid behavior -------------------------------------------------------------
const gr = prompt({ ...base, style: 'grid' });
check('grid: hard style lock rendered', gr.includes('GRID (hard style lock)') && gr.includes('steel-window / divided-lite look'));
check('grid: one grid, bars level across panels and door', gr.includes('ONE GRID across the whole enclosure') && gr.includes('each horizontal grid line runs straight and level'));
check('grid: missing / mismatched grid fails', gr.includes('if any panel or the door is missing its grid'));
check('grid: rectangles only, no decorative / wood grilles', gr.includes('Diamond, arched, curved or colonial patterns'));
check('grid: bar and pane proportions', gr.includes('about 1 to 1.5 inches wide, uniform everywhere (perimeter, mullions and grid bars)') && gr.includes('PANES: each pane about 1.5 to 2.5 feet wide'));
check('grid: grid door, hinges one stile, handle the other', gr.includes('DOOR (grid)') && gr.includes('carrying the same grid as the fixed panels'));
check('grid: no framed / frameless sections rendered', !gr.includes('FRAMED (hard style lock)') && !gr.includes('FRAMELESS (hard style lock)') && !gr.includes('DOOR (framed)') && !gr.includes('DOOR (frameless)'));
check('grid: not on the unsupported list for this style', !gr.includes('divided-lite or grid-style glass: French doors'));
check('grid: self-check covers the grid', gr.includes('Grid: does every panel AND the door carry the same grid'));
check('grid: spec + summary name the style', gr.includes('enclosure_style: Grid') && formatRoomEnclosureSummary({ ...base, style: 'grid' }) === 'Wine Room • Grid • Matte Black');
check('framed / frameless: a grid only when Grid is selected', fl.includes('a grid of panes on a Framed or Frameless enclosure') && fr.includes('(that is the separate Grid style)'));
const sysGrid = buildRoomEnclosureSystemPrompt();
check('system prompt: grid approved, only when selected', sysGrid.includes('slim FRAMED, FRAMELESS or GRID') && sysGrid.includes('A grid of panes appears ONLY when the specification selects the GRID style'));
check('validation: grid accepted', validateRoomEnclosureSelections({ ...buildRoomEnclosurePayload({ ...base, style: 'grid' }, 'g')! }).length === 0);

// --- Dining room ----------------------------------------------------------------
const dr = prompt({ ...base, application: 'dining_room' });
check('dining room: placement rule rendered', dr.includes('DINING ROOM:') && dr.includes('The table, chairs, sideboard, rug and light fixture stay inside'));
check('dining room: glass never through the furniture', dr.includes('The glass never runs through or in front of the table, chairs or sideboard'));
check('dining room: spec names the room', dr.includes('room_type: Dining Room'));
check('dining room: other room types not rendered', !dr.includes('WINE ROOM:') && !dr.includes('ROOM / ALCOVE:'));
check('validation: dining room accepted', validateRoomEnclosureSelections({ ...buildRoomEnclosurePayload({ ...base, application: 'dining_room' }, 'd')! }).length === 0);
check('validation prompt: detects dining rooms', getRoomEnclosureValidationPrompt().includes("'dining_room': a dining table with chairs"));

// --- Half-height stays banned ---------------------------------------------------
check('half-height: still on the unsupported list for every style', [fl, fr, gr].every((p) => p.includes('half-height, pony-wall or counter-height glass partitions')));
check('half-height: full height required', gr.includes('HEIGHT: full height') && gr.includes('Never a half-height'));

// --- Door on every render -----------------------------------------------------
const DOOR = 'Include EXACTLY ONE operable glass door';
check('door: mandatory section', fl.includes('DOOR (mandatory for every render)') && fl.includes(DOOR));
check('door: swinging only, never sliding / barn', fl.includes('Never a sliding, bypass, barn, pocket, folding or accordion door'));
check('self-check: door item', fl.includes('4. Is there exactly one obvious swinging glass door'));
check('door: hinges on one edge, handle on the other', fl.includes('HINGE SIDE vs HANDLE SIDE') && fl.includes('Nothing else is on the latch edge') && fr.includes('HINGE SIDE vs HANDLE SIDE'));
check('door: walk-through size, ~36 in', fl.includes('DOOR SIZE: a real walk-through door about 36 inches wide'));
check('self-check: hinge side + door size item', fl.includes('4b. Are ALL of the door hinges'));

// --- Glass: full height, full width -------------------------------------------
check('glass: clear, no tint / frost', fl.includes('No tint, smoke, frost, reeding, pattern or mirror'));
check('glass: full height, never half-height', fl.includes('HEIGHT: full height') && fl.includes('Never a half-height'));
check('glass: full width of the opening', fl.includes('COVERAGE: the enclosure closes the ENTIRE open side(s)'));

// --- Finish across visible hardware ------------------------------------------
check('finish: applied to all visible hardware, one finish', fl.includes('ALL visible enclosure hardware') && fl.includes('ONE finish only'));
check('finish: explicit selection overrides inspiration', fl.includes('overrides any finish shown in an inspiration image'));
check('finish: matte black descriptor rendered', fl.includes('Selected finish: matte black'));
const pb = prompt({ ...base, finish: 'polished_brass' });
check('finish: polished brass descriptor rendered', pb.includes('polished (mirror) brass'));
const sb = prompt({ ...base, finish: 'satin_brass' });
check('finish: satin brass descriptor rendered', sb.includes('satin (brushed) brass'));

// --- Room-type placement ------------------------------------------------------
check('wine room: racks stay visible behind the glass', fl.includes('WINE ROOM:') && fl.includes('Never run glass through or in front of individual racks'));
check('wine room: no racks added', fl.includes('If no racks are visible in input_1, do NOT add any'));
const us = prompt({ ...base, application: 'under_stair' });
check('under-stair: raked top edge follows the stair', us.includes('UNDER-STAIR:') && us.includes('RAKED to follow the underside of the stair'));
check('under-stair: stair preserved, no glass on treads', us.includes('Preserve the staircase exactly') && us.includes('never put glass on the stair treads'));
check('under-stair: self-check item', us.includes('5c. Under-stair:'));
check('wine room: no under-stair rule', !fl.includes('UNDER-STAIR:'));
const ho = prompt({ ...base, application: 'home_office' });
check('home office: full-height wall, desk stays', ho.includes('HOME OFFICE:') && ho.includes('The desk, chair, shelving and equipment stay inside'));
const other = prompt({ ...base, application: 'other_room' });
check('other room: generic placement', other.includes('ROOM / ALCOVE:'));
check('spec: room type name rendered', fl.includes('room_type: Wine Room'));

// --- Existing condition -------------------------------------------------------
check('open opening: add across the opening', fl.includes('The space is OPEN') && fl.includes('ADD the enclosure across the existing opening'));
const part = prompt({ ...base, existing_condition: 'existing_partition' });
check('existing partition: remove only the partition, same line', part.includes('REMOVE only that partition / door') && part.includes('along the SAME line'));
check('existing partition: open-opening rule not rendered', !part.includes('The space is OPEN'));
const glass = prompt({ ...base, existing_condition: 'existing_glass' });
check('existing glass: replace along the same line', glass.includes('An existing glass enclosure or glass door is present'));
// 'none' requires a drawn line (see requiresPlacementLine), so the prompt is
// only ever assembled with one; the rule still names the no-line fallback.
const unknown = prompt({ ...base, existing_condition: 'none', placement_path: LINE });
check('unknown condition: placement path decides, else infer the opening', unknown.includes('If a customer placement path is provided below, it decides the location') && unknown.includes('identify the single most logical opening') && unknown.includes('CUSTOMER PLACEMENT PATH'));

// --- Preservation / target only ----------------------------------------------
check('preservation: racks, bottles, furniture untouched', fl.includes('Do not add, remove, move or restyle wine racks, bottles, shelving, furniture'));
check('preservation: target opening only', fl.includes('TARGET OPENING ONLY'));
check('preservation: other glass / windows unchanged', fl.includes('Every OTHER window, glass door, mirror, shower enclosure, railing'));
check('self-check: other glass item', fl.includes('5b. Is every window, glass door, mirror'));
const sys = buildRoomEnclosureSystemPrompt();
check('system prompt: only the target opening changes', sys.includes('Only the target opening changes'));
check('system prompt: new install mandatory', sys.includes('installing the enclosure is the entire purpose'));
check('system prompt: door mandatory', sys.includes('Every render includes one swinging glass door'));

// --- Unsupported types excluded ----------------------------------------------
check('unsupported list present', fl.includes('NOT APPROVED (never render these'));
for (const t of UNSUPPORTED_ENCLOSURE_TYPES) {
  check(`unsupported listed: ${t.id}`, fl.includes(t.label));
}

// --- Match Inspiration path ---------------------------------------------------
const insp = prompt({ ...base, mode: 'inspiration', style: null, finish: null });
check('inspiration: style donor only', insp.includes('input_2 controls STYLE only'));
check('inspiration: style mapped to framed / frameless', insp.includes('Read the enclosure in input_2 and map it to exactly ONE approved style'));
check('inspiration: grid / steel-window / French-door look maps to Grid', insp.includes('steel-window or French-door look (bars dividing each panel into several panes) → GRID'));
check('inspiration: storefront still maps to slim framed, no grid', insp.includes('heavy commercial storefront look → FRAMED with slim profiles and NO grid of small panes'));
check('inspiration: unsupported types map to the grid style by name', insp.includes('render as the Grid style'));
check('inspiration: unsupported types mapped', insp.includes('Never copy an unsupported enclosure type from input_2') && insp.includes('render as'));
check('inspiration: unsupported list still present', insp.includes('NOT APPROVED (never render these'));
check('inspiration: silver / nickel maps to brushed stainless', insp.includes('silver, grey, nickel, chrome, satin, brushed') && insp.includes('BRUSHED (satin) STAINLESS STEEL'));
check('inspiration: no default to black', insp.includes('Do NOT default to matte black'));
check('inspiration: door still mandatory', insp.includes(DOOR) && insp.includes('Build the door to match the style you chose from input_2'));
check('inspiration: no hard style lock rendered', !insp.includes('(hard style lock)'));
check('inspiration: target only', insp.includes('apply ONLY to the new target enclosure'));
const inspStyle = prompt({ ...base, mode: 'inspiration', style: 'framed', finish: null });
check('inspiration + style override: explicit style wins', inspStyle.includes('FRAMED (hard style lock)') && !inspStyle.includes('Read the enclosure in input_2'));
const inspFinish = prompt({ ...base, mode: 'inspiration', style: null, finish: 'brushed_stainless' });
check('inspiration + finish override: explicit finish wins', inspFinish.includes('brushed (satin) stainless steel') && !inspFinish.includes('Read the hardware color in input_2'));
check('configure: no inspiration rules rendered', !fl.includes('INSPIRATION RULES:') && !fl.includes('input_2'));

// --- Validation blocks unsupported selections --------------------------------
const bad = {
  product: 'room_enclosure', mode: 'configure', application: 'wine_room', style: 'french_doors',
  finish: 'matte_black', existing_condition: 'none', placement: 'inferred', session_id: 'x', catalog_version: '2026.11',
} as unknown as RoomEnclosurePayload;
check('validation: unsupported style rejected', validateRoomEnclosureSelections(bad).some((i) => i.field === 'style'));
check('validation: unsupported finish rejected', validateRoomEnclosureSelections({ ...bad, style: 'framed', finish: 'chrome' } as unknown as RoomEnclosurePayload).some((i) => i.field === 'finish'));
check('validation: unsupported room type rejected', validateRoomEnclosureSelections({ ...bad, style: 'framed', application: 'bathroom' } as unknown as RoomEnclosurePayload).some((i) => i.field === 'application'));
check('validation: configure requires style + finish', validateRoomEnclosureSelections({ ...bad, style: null, finish: null } as RoomEnclosurePayload).length === 2);
check('validation: all five finishes accepted', ROOM_ENCLOSURE_FINISH_ORDER.every((f) => validateRoomEnclosureSelections({ ...bad, style: 'framed', finish: f } as RoomEnclosurePayload).length === 0));
check('validation: inspiration allows nulls', validateRoomEnclosureSelections({ ...bad, mode: 'inspiration', style: null, finish: null } as RoomEnclosurePayload).length === 0);
let threw = false;
try {
  buildRoomEnclosurePrompt(buildRoomEnclosurePromptInput(bad));
} catch (e) {
  threw = e instanceof RoomEnclosureRuleViolationError;
}
check('prompt assembly: throws on unsupported selection', threw);

// --- Validation prompt + summary ---------------------------------------------
const val = getRoomEnclosureValidationPrompt();
check('validation prompt: detects existing condition + room type', val.includes("'open_opening'") && val.includes("'under_stair'"));
check('validation prompt: rejects bathrooms and outdoor-only scenes', val.includes('A bathroom, shower, or tub') && val.includes('Purely an outdoor scene'));
check('summary: configure', formatRoomEnclosureSummary(base) === 'Wine Room • Frameless • Matte Black');
check('summary: inspiration without overrides', formatRoomEnclosureSummary({ mode: 'inspiration', application: 'under_stair' }) === 'Under-Stair Nook • Inspiration');
check('template: visualization version 1.3.0', roomEnclosureVisualizationTemplate.version === '1.3.0');

// --- Customer placement path ---------------------------------------------------
const drawn = prompt({ ...base, placement_path: LINE });
check('placement: drawn path renders the placement section', drawn.includes('CUSTOMER PLACEMENT PATH (authoritative for location):') && drawn.includes('BRIGHT MAGENTA PATH'));
check('placement: one glass wall per segment, corners where segments meet', drawn.includes('Each segment is ONE straight full-height glass wall') && drawn.includes('the glass walls meet at a corner'));
check('placement: path overrides the inferred opening, no walls added or dropped', drawn.includes('The path overrides any opening you would otherwise infer') && drawn.includes('do not add walls the path does not show'));
check('placement: magenta path never rendered', drawn.includes('The output contains NO magenta, pink or purple line') && drawn.includes('9. Is there any magenta, pink or purple line'));
check('placement: glass touches the floor at the dots, never set back', drawn.includes('EXACT POSITION: each corner dot is the exact point') && drawn.includes('the glass stands in front of it, on the path'));
check('placement: traced outlines are edges, not walls', drawn.includes('TRACED OUTLINES:') && drawn.includes('A traced segment never becomes an extra glass wall'));
check('placement: corners in words rendered', drawn.includes('PLACEMENT PATH IN WORDS') && drawn.includes('2 segments through 3 corners') && drawn.includes('corner 1 at 10% from the left edge and 80% down'));
check('placement: no corners section without a path', !fl.includes('PLACEMENT PATH IN WORDS'));
check('placement: corners text empty for no / one-point path', describePlacementCorners(null) === '' && describePlacementCorners([LINE.points[0]]) === '');
check('placement: no corners without the path arg', !prompt2({ ...base, placement_path: LINE }).includes('PLACEMENT PATH IN WORDS'));
check('placement: spec names the drawn path', drawn.includes('placement: customer-drawn floor path, one glass wall per segment'));
check('placement: no path → no placement section', !fl.includes('CUSTOMER PLACEMENT PATH') && fl.includes('placement: inferred from the opening in input_1'));
check('self-check: placement item', drawn.includes('8. If a customer placement path was provided') && drawn.includes('no walls added or dropped'));
const openFloor = prompt({ ...base, existing_condition: 'open_floor', placement_path: LINE });
check('open floor: create the room, a wall on every segment', openFloor.includes('The area is OPEN FLOOR') && openFloor.includes('CREATE the room') && openFloor.includes('EVERY segment of the customer placement path'));
check('open floor: open-opening rule not rendered', !openFloor.includes('The space is OPEN (no wall'));
check('open floor: placement section rendered', openFloor.includes('CUSTOMER PLACEMENT PATH'));
check(
  'placement: required for open floor / unknown, optional otherwise',
  requiresPlacementPath('open_floor') &&
    requiresPlacementPath('none') &&
    requiresPlacementPath(null) &&
    !requiresPlacementPath('open_opening') &&
    !requiresPlacementPath('existing_partition') &&
    !requiresPlacementPath('existing_glass')
);
check('path: two corners = one wall, three = two walls', placementWallCount({ points: LINE.points.slice(0, 2) }) === 1 && placementWallCount(LINE) === 2 && placementWallCount(null) === 0);
check('path: a single tapped corner is incomplete', !isPlacementPathComplete({ points: [LINE.points[0]] }));
check('path: a segment shorter than the minimum is incomplete', !isPlacementPathComplete({ points: [{ x: 0.5, y: 0.5 }, { x: 0.51, y: 0.5 }] }));
check('path: the L-shaped fixture is complete', isPlacementPathComplete(LINE));
check('form: open floor without a path is incomplete', !isRoomEnclosureFormComplete({ ...base, existing_condition: 'open_floor' }));
check('form: open floor with a path is complete', isRoomEnclosureFormComplete({ ...base, existing_condition: 'open_floor', placement_path: LINE }));
check('form: unknown condition without a path is incomplete', !isRoomEnclosureFormComplete({ ...base, existing_condition: 'none' }));
check('form: bounded opening needs no path', isRoomEnclosureFormComplete(base));
check('form: a half-drawn path blocks even when optional', !isRoomEnclosureFormComplete({ ...base, placement_path: { points: [LINE.points[0]] } }));
check('form: inspiration mode still needs the path on open floor', !isRoomEnclosureFormComplete({ ...base, mode: 'inspiration', style: null, finish: null, existing_condition: 'open_floor' }));
check('reference description: placement only, path never reproduced', PLACEMENT_REFERENCE_DESCRIPTION.includes('Do NOT reproduce the magenta path'));
check('reference description: black-and-white copy, not a canvas', PLACEMENT_REFERENCE_DESCRIPTION.includes('NOT A CANVAS') && PLACEMENT_REFERENCE_DESCRIPTION.includes('black-and-white copy of input_1'));
check('validation prompt: detects open floor', val.includes("'open_floor'") && val.includes("use 'open_floor' only when nothing frames it"));
check('validation prompt: a plain room is valid', val.includes('Any ordinary interior room') && val.includes('Never reject an interior photo for lacking a staircase, balcony, edge, nook or opening'));

// --- No unresolved placeholders ---------------------------------------------
for (const [n, p] of [['frameless', fl], ['framed', fr], ['insp', insp], ['under_stair', us], ['drawn', drawn], ['open_floor', openFloor], ['grid', gr], ['dining_room', dr]] as const) {
  check(`no leftover placeholders (${n})`, !/\{\{\w+\}\}/.test(p));
}

console.log(failures === 0 ? '\nAll room enclosure rule checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
