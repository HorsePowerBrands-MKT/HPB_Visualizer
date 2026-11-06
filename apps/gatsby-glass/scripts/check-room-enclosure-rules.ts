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
  requiresPlacementLine,
  RoomEnclosureRuleViolationError,
  UNSUPPORTED_ENCLOSURE_TYPES,
  PLACEMENT_REFERENCE_DESCRIPTION,
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
  placement_line: null,
};
const LINE = { x1: 0.1, y1: 0.8, x2: 0.9, y2: 0.78 };
const prompt = (form: RoomEnclosureForm) =>
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
check('frameless: held only by a slim channel', fl.includes('held ONLY by a slim low-profile channel'));
check('frameless: posts / mullions / frames forbidden', fl.includes('if ANY vertical post, mullion, frame profile'));
check('frameless: channel proportions (~1 in)', fl.includes('CHANNEL: a slim U-channel about 1 inch tall'));
check('frameless: no framed section rendered', !fl.includes('FRAMED (hard style lock)'));
check('frameless: frameless door hardware', fl.includes('DOOR (frameless)') && fl.includes('tall vertical pull handle'));
check('frameless: no framed door section', !fl.includes('DOOR (framed)'));

// --- Framed behavior ----------------------------------------------------------
const fr = prompt({ ...base, style: 'framed' });
check('framed: hard style lock rendered', fr.includes('FRAMED (hard style lock)'));
check('framed: perimeter frame + mullions', fr.includes('one continuous perimeter frame') && fr.includes('thin vertical mullions'));
check('framed: missing frame / storefront / grid forbidden', fr.includes('if a glass edge is left without its frame'));
check('framed: profile proportions (1–1.5 in)', fr.includes('about 1 to 1.5 inches wide'));
check('framed: mullions only at panel joints, never a grid', fr.includes('MULLIONS: ONLY at panel joints') && fr.includes('Never a grid of small panes'));
check('framed: no frameless section rendered', !fr.includes('FRAMELESS (hard style lock)'));
check('framed: framed door hardware', fr.includes('DOOR (framed)') && !fr.includes('DOOR (frameless)'));

// --- Door on every render -----------------------------------------------------
const DOOR = 'Include EXACTLY ONE operable glass door';
check('door: mandatory section', fl.includes('DOOR (mandatory for every render)') && fl.includes(DOOR));
check('door: swinging only, never sliding / barn', fl.includes('Never a sliding, bypass, barn, pocket, folding or accordion door'));
check('self-check: door item', fl.includes('4. Is there exactly one obvious swinging glass door'));

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
const unknown = prompt({ ...base, existing_condition: 'none', placement_line: LINE });
check('unknown condition: placement line decides, else infer the opening', unknown.includes('If a customer placement line is provided below, it decides the location') && unknown.includes('identify the single most logical opening') && unknown.includes('CUSTOMER PLACEMENT LINE'));

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
check('inspiration: grid / French door maps to slim framed, no grid', insp.includes('FRAMED with slim profiles and NO grid of small panes'));
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
check('template: visualization version 1.1.0', roomEnclosureVisualizationTemplate.version === '1.1.0');

// --- Customer placement line ---------------------------------------------------
const drawn = prompt({ ...base, placement_line: LINE });
check('placement: drawn line renders the placement section', drawn.includes('CUSTOMER PLACEMENT LINE (authoritative for location):') && drawn.includes('BRIGHT MAGENTA LINE'));
check('placement: line overrides the inferred opening', drawn.includes('The line overrides any opening you would otherwise infer'));
check('placement: magenta line never rendered', drawn.includes('It must NOT appear in the output in any form'));
check('placement: spec names the drawn line', drawn.includes('placement: customer-drawn floor line'));
check('placement: no line → no placement section', !fl.includes('CUSTOMER PLACEMENT LINE') && fl.includes('placement: inferred from the opening in input_1'));
check('self-check: placement item', drawn.includes('8. If a customer placement line was provided'));
const openFloor = prompt({ ...base, existing_condition: 'open_floor', placement_line: LINE });
check('open floor: new wall along the line with returns', openFloor.includes('The area is OPEN FLOOR') && openFloor.includes('short glass return panel'));
check('open floor: open-opening rule not rendered', !openFloor.includes('The space is OPEN (no wall'));
check('open floor: placement section rendered', openFloor.includes('CUSTOMER PLACEMENT LINE'));
check(
  'placement: required for open floor / unknown, optional otherwise',
  requiresPlacementLine('open_floor') &&
    requiresPlacementLine('none') &&
    requiresPlacementLine(null) &&
    !requiresPlacementLine('open_opening') &&
    !requiresPlacementLine('existing_partition') &&
    !requiresPlacementLine('existing_glass')
);
check('form: open floor without a line is incomplete', !isRoomEnclosureFormComplete({ ...base, existing_condition: 'open_floor' }));
check('form: open floor with a line is complete', isRoomEnclosureFormComplete({ ...base, existing_condition: 'open_floor', placement_line: LINE }));
check('form: unknown condition without a line is incomplete', !isRoomEnclosureFormComplete({ ...base, existing_condition: 'none' }));
check('form: bounded opening needs no line', isRoomEnclosureFormComplete(base));
check('form: inspiration mode still needs the line on open floor', !isRoomEnclosureFormComplete({ ...base, mode: 'inspiration', style: null, finish: null, existing_condition: 'open_floor' }));
check('reference description: placement only, line never reproduced', PLACEMENT_REFERENCE_DESCRIPTION.includes('Do NOT reproduce the magenta line'));
check('validation prompt: detects open floor', val.includes("'open_floor'") && val.includes("use 'open_floor' only when nothing frames it"));

// --- No unresolved placeholders ---------------------------------------------
for (const [n, p] of [['frameless', fl], ['framed', fr], ['insp', insp], ['under_stair', us], ['drawn', drawn], ['open_floor', openFloor]] as const) {
  check(`no leftover placeholders (${n})`, !/\{\{\w+\}\}/.test(p));
}

console.log(failures === 0 ? '\nAll room enclosure rule checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
