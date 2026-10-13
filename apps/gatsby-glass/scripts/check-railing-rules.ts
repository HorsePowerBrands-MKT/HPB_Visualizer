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
} from '../lib/railing';
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

// --- Finish across visible hardware ----------------------------------------
check('finish: applied to all visible hardware, one finish', bs.includes('ALL visible railing hardware') && bs.includes('ONE finish only'));
check('finish: explicit selection overrides inspiration', bs.includes('overrides any finish shown in an inspiration image'));

// --- Pool gate logic --------------------------------------------------------
const poolBs = prompt({ ...base, application: 'pool_balustrade', existing_condition: 'none' });
check('pool + base shoe: gate mandatory + shoe interrupted at gate', poolBs.includes('POOL GATE (mandatory') && poolBs.includes('Interrupt the base shoe at the operable gate opening'));
const poolSp = prompt({ ...base, application: 'pool_balustrade', railing_system: 'spigot', existing_condition: 'none' });
check('pool + spigot: no spigot beneath gate', poolSp.includes('Do not place a spigot directly beneath the operable gate panel'));
check('non-pool: no gate section', !bs.includes('POOL GATE'));

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
const inspOverride = prompt({ ...base, mode: 'inspiration', railing_system: null, handrail: null, finish: 'brushed_stainless' });
check('inspiration + finish override: explicit finish wins', inspOverride.includes('brushed (satin) stainless steel') && !inspOverride.includes('Match the hardware finish shown in input_2'));

// --- Validation blocks unsupported selections ------------------------------
const bad = {
  product: 'railing', mode: 'configure', application: 'exterior_deck', railing_system: 'cable_rail',
  handrail: 'top_mount', finish: 'matte_black', existing_condition: 'none', session_id: 'x', catalog_version: '2025.10',
} as unknown as RailingPayload;
check('validation: unsupported system rejected', validateRailingSelections(bad).some((i) => i.field === 'railing_system'));
check('validation: configure requires all selections', validateRailingSelections({ ...bad, railing_system: null, handrail: null, finish: null } as RailingPayload).length === 3);
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
