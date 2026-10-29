/**
 * Acceptance checks for the railing compatibility / guardrail rules.
 * Assembles real prompts through the production builder and asserts the
 * rules show up (or are blocked) for both consumer paths.
 *
 * Run from apps/gatsby-glass:   pnpm check:railing-rules
 * (uses npx tsx; no repo dependency added)
 */
import {
  buildRailingPrompt,
  buildRailingPayload,
  buildRailingPromptInput,
  validateRailingSelections,
  RailingRuleViolationError,
  UNSUPPORTED_RAILING_TYPES,
  buildRailingSystemPrompt,
} from '../lib/railing';
import { railingVisualizationTemplate } from '../prompts/railing-templates';
import type { RailingForm, RailingPayload } from '../lib/railing';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? `  — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

const base: RailingForm = {
  mode: 'configure',
  application: 'exterior_deck',
  railing_system: 'base_shoe',
  handrail: 'top_mount',
  finish: 'matte_black',
  existing_condition: 'existing_railing',
  detected_setting: 'exterior',
  application_detected: true,
};
const prompt = (form: RailingForm) =>
  buildRailingPrompt(buildRailingPromptInput(buildRailingPayload(form, 'check')!));

// --- Base Shoe behavior -----------------------------------------------------
const bs = prompt(base);
check('base shoe: continuous low-profile channel', bs.includes('ONE continuous low-profile base shoe'));
check('base shoe: spigots/posts forbidden (hard lock)', bs.includes('if ANY spigots, floor-mounted posts, clamps or vertical frames appear'));
check('base shoe: proportions stated (~2–2.5 in)', bs.includes('HEIGHT: about 2 to 2.5 inches'));
check('base shoe: no spigot section rendered', !bs.includes('SPIGOT (hard system lock)'));

// --- Spigot behavior --------------------------------------------------------
const sp = prompt({ ...base, railing_system: 'spigot' });
check('spigot: individual spigots, two per panel', sp.includes('two per panel'));
check('spigot: base shoe / channel forbidden (hard lock)', sp.includes('if a continuous bottom channel, base shoe, posts or vertical framing appear'));
check('spigot: no base shoe section rendered', !sp.includes('BASE SHOE (hard system lock)'));

// --- Handrail vs no handrail ------------------------------------------------
check('top-mount: cap rail on edge, no face rail', bs.includes('TOP-MOUNTED (hard lock)') && bs.includes('Do NOT add any second rail on the glass face'));
const sm = prompt({ ...base, handrail: 'side_mount' });
check('side-mount: face rail, no cap rail', sm.includes('SIDE-MOUNTED (hard lock)') && sm.includes('Do NOT add a cap rail on top of the glass'));
const nh = prompt({ ...base, handrail: 'no_handrail' });
check('no handrail: hard negative, no rail sections', nh.includes('NO HANDRAIL (hard lock)') && !nh.includes('TOP-MOUNTED (hard lock)') && !nh.includes('SIDE-MOUNTED (hard lock)'));
const COVERAGE = 'the handrail runs along EVERY glass run in the render';
check('top-mount: rail on every run', bs.includes(COVERAGE));
check('side-mount: rail on every run', sm.includes(COVERAGE));
check('no handrail: no coverage rule', !nh.includes(COVERAGE));
check('side-mount: round grab rail on standoff brackets (Gatsby photo)', sm.includes('round tube grab rail') && sm.includes('compact standoff brackets'));
check('side-mount: no "standoff pins" / "no large brackets" contradiction', !sm.includes('standoff pins') && !sm.includes('no large brackets'));

check('self-check: handrail on every run', bs.includes('on EVERY glass run (no run missing its rail)'));

// --- Deck: every open edge guarded -----------------------------------------
check('deck: glass + handrail on every open edge', bs.includes('EVERY open edge of the deck') && bs.includes('BOTH side returns'));
check('non-deck: no deck edge rule', !prompt({ ...base, application: 'interior_balcony' }).includes('EVERY open edge of the deck'));

// --- Finish across visible hardware ----------------------------------------
check('finish: applied to all visible hardware, one finish', bs.includes('ALL visible railing hardware') && bs.includes('ONE finish only'));
check('finish: explicit selection overrides inspiration', bs.includes('overrides any finish shown in an inspiration image'));

// --- Pool gate logic --------------------------------------------------------
const poolBs = prompt({ ...base, application: 'pool_balustrade', existing_condition: 'none' });
check('pool + base shoe: gate mandatory + shoe interrupted at gate', poolBs.includes('POOL GATE (mandatory') && poolBs.includes('Interrupt the base shoe at the operable gate opening'));
const poolSp = prompt({ ...base, application: 'pool_balustrade', railing_system: 'spigot', existing_condition: 'none' });
check('pool + spigot: no spigot beneath gate', poolSp.includes('Do not place a spigot directly beneath the operable gate panel'));
check('non-pool: no gate section', !bs.includes('POOL GATE'));
const SETBACK = 'at least 4 feet (about 1.2 m';
check('pool, no fence: 4 ft setback from coping', poolBs.includes(SETBACK) && poolBs.includes('Never place glass on the coping'));
check('pool, existing fence: keeps fence line, no setback rule', !prompt({ ...base, application: 'pool_balustrade', existing_condition: 'existing_fence' }).includes(SETBACK));
check('non-pool: no setback rule', !bs.includes(SETBACK));
check('self-check: pool setback', poolBs.includes('clear walkway of at least 4 feet between the glass and the coping'));

// --- Existing railing replacement geometry ---------------------------------
check('existing railing: same location / slope / edge / perimeter', bs.includes('SAME railing location, stair slope, landing geometry, balcony edge or deck perimeter'));

// --- Unsupported types excluded --------------------------------------------
check('unsupported list present (B27)', bs.includes('NOT APPROVED (never render these'));
for (const t of UNSUPPORTED_RAILING_TYPES) {
  check(`unsupported listed: ${t.id}`, bs.includes(t.label));
}

// --- Match Inspiration path -------------------------------------------------
const insp = prompt({ ...base, mode: 'inspiration', railing_system: null, handrail: null, finish: null });
check('inspiration: maps unsupported types to approved systems', insp.includes('Never copy an unsupported railing type from input_2') && insp.includes('render as frameless glass'));
check('inspiration: one approved system, no mixing', insp.includes('Use exactly one system consistently for every fixed panel'));
check('inspiration: unsupported list still present', insp.includes('NOT APPROVED (never render these'));
check('inspiration: separate graspable rail maps to side-mount', insp.includes('If input_2 shows any separate graspable handrail, render SIDE-MOUNTED') && insp.includes('Do NOT substitute a top-mounted cap rail for a true handrail'));
check('inspiration: handrail fallback carries coverage rule', insp.includes(COVERAGE));
check('inspiration: silver / nickel maps to brushed stainless', insp.includes('silver, grey, nickel, chrome, satin, brushed') && insp.includes('BRUSHED (satin) STAINLESS STEEL'));
check('inspiration: no default to black', insp.includes('Do NOT default to matte black'));
const inspHandrailOverride = prompt({ ...base, mode: 'inspiration', railing_system: null, handrail: 'top_mount', finish: null });
check('inspiration + handrail override: explicit handrail wins', inspHandrailOverride.includes('TOP-MOUNTED (hard lock)') && !inspHandrailOverride.includes('Read the handrail in input_2'));
const inspOverride = prompt({ ...base, mode: 'inspiration', railing_system: null, handrail: null, finish: 'brushed_stainless' });
check('inspiration + finish override: explicit finish wins', inspOverride.includes('brushed (satin) stainless steel') && !inspOverride.includes('Read the hardware color in input_2'));

// --- Brass finishes ---------------------------------------------------------
const pb = prompt({ ...base, finish: 'polished_brass' });
check('finish: polished brass descriptor rendered', pb.includes('polished (mirror) brass'));
const sb = prompt({ ...base, finish: 'satin_brass' });
check('finish: satin brass descriptor rendered', sb.includes('satin (brushed) brass'));
check('inspiration: shiny gold maps to polished brass', insp.includes('→ POLISHED BRASS'));
check('inspiration: brushed gold / champagne maps to satin brass', insp.includes('champagne') && insp.includes('→ SATIN BRASS'));
check('inspiration: brass no longer listed as unapproved', !/brass[^\n]*NOT approved/.test(insp));

// --- Background railings (HP-2803) -------------------------------------------
const TARGET_ONLY = 'TARGET RAILING ONLY: change exactly ONE railing line';
check('background: target-only rule (configure)', bs.includes(TARGET_ONLY) && bs.includes('Never recolor a non-target railing'));
check('background: target-only rule (inspiration)', insp.includes(TARGET_ONLY));
check('background: inspiration style limited to target railing', insp.includes('apply ONLY to the new target railing'));
check('background: self-check item present', bs.includes('5b. Is every railing, fence or banister OTHER than the target railing identical to input_1'));
check('background: existing-railing replacement leaves other railings', bs.includes('Any OTHER existing railing in view'));
const sys = buildRailingSystemPrompt();
check('background: system prompt preservation rule', sys.includes('Only the target railing changes.'));
check('template: visualization version 1.3.0', railingVisualizationTemplate.version === '1.3.0');

// --- QA round 2026-10-29: edges, openings, stairs, spigot count --------------
const EDGE = 'EDGE GEOMETRY: follow the edge in input_1 exactly, including EVERY short jog, dog-leg';
const OPENINGS = 'ACCESS OPENINGS STAY OPEN';
const STAIRS = 'STAIRS: if a stair is visible, keep it exactly where it is';
check('edges: dog-leg / jog rule (deck)', bs.includes(EDGE));
check('edges: railing reaches the house (deck)', bs.includes('from tight against the house wall'));
check('edges: all sides guarded (deck)', bs.includes('guard every open side'));
check('openings: glass never across a stair or doorway (deck)', bs.includes(OPENINGS) && bs.includes('never across the stairs'));
check('stairs: stairs and deck never rebuilt (deck)', bs.includes(STAIRS));
const stair = prompt({ ...base, application: 'interior_staircase', existing_condition: 'half_wall', detected_setting: 'interior' });
check('edges/openings/stairs: interior staircase too', stair.includes(EDGE) && stair.includes(OPENINGS) && stair.includes(STAIRS));
const pool = prompt({ ...base, application: 'pool_balustrade', existing_condition: 'none' });
check('edges/openings/stairs: not rendered for pool', !pool.includes(EDGE) && !pool.includes(OPENINGS));
check('base shoe: continues on stairs as a raked channel on the stringer', bs.includes('never drop the shoe on the stairs') && bs.includes('never steps up tread by tread'));
check('spigot: count capped at two per panel', sp.includes('never more than two per panel') && sp.includes('Number of spigots = 2 × number of panels'));
check('spigot: every stair panel supported to the bottom step', sp.includes('every stair panel gets its own two spigots') && sp.includes('BOTTOM step'));
check('side-mount: exactly one rail, capped top edge fails', sm.includes('EXACTLY ONE rail per glass run'));
check('self-check: openings / jogs / house item', bs.includes('5c. Are the deck, stairs and every doorway'));
check('self-check: stair mounting item', bs.includes('5d. Stairs:'));

// --- Validation blocks unsupported selections ------------------------------
const bad = {
  product: 'railing', mode: 'configure', application: 'exterior_deck', railing_system: 'cable_rail',
  handrail: 'top_mount', finish: 'matte_black', existing_condition: 'none', session_id: 'x', catalog_version: '2025.10',
} as unknown as RailingPayload;
check('validation: unsupported system rejected', validateRailingSelections(bad).some((i) => i.field === 'railing_system'));
check('validation: configure requires all selections', validateRailingSelections({ ...bad, railing_system: null, handrail: null, finish: null } as RailingPayload).length === 3);
check('validation: brass finishes accepted', (['polished_brass', 'satin_brass'] as const).every((f) => validateRailingSelections({ ...bad, railing_system: 'base_shoe', finish: f } as RailingPayload).length === 0));
check('validation: inspiration allows nulls', validateRailingSelections({ ...bad, mode: 'inspiration', railing_system: null, handrail: null, finish: null } as RailingPayload).length === 0);
let threw = false;
try {
  buildRailingPrompt(buildRailingPromptInput(bad));
} catch (e) {
  threw = e instanceof RailingRuleViolationError;
}
check('prompt assembly: throws on unsupported selection', threw);

// --- No unresolved placeholders ---------------------------------------------
for (const [n, p] of [['base', bs], ['spigot', sp], ['insp', insp]] as const) {
  check(`no leftover placeholders (${n})`, !/\{\{\w+\}\}/.test(p));
}

console.log(failures === 0 ? '\nAll railing rule checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
