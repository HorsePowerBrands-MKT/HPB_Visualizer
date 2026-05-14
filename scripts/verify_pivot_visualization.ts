/**
 * Pivot-door visualization smoke test.
 *
 * Renders the actual prompt the AI will receive for every pivot variant
 * (direction × framing × ceiling) and asserts the side-specific clauses,
 * forbidden-element list, and self-check checklist are all wired through.
 *
 * Run with:
 *   npx tsx scripts/verify_pivot_visualization.ts            # summary + asserts
 *   npx tsx scripts/verify_pivot_visualization.ts --dump     # also print full prompt for one variant
 */

import {
  registerBrandTemplates,
  buildVisualizationPromptFromTemplate,
  getSystemPromptFromTemplate,
} from '../packages/prompt-templates/src/index';
import {
  gatsbyGlassTemplates,
  gatsbyGlassRegistry,
} from '../apps/gatsby-glass/prompts/gatsby-templates';
import { CATALOG } from '../apps/gatsby-glass/lib/gatsby-constants/src/catalog';

registerBrandTemplates(gatsbyGlassTemplates, gatsbyGlassRegistry);

const DUMP = process.argv.includes('--dump');

type PivotDir = 'left' | 'right' | 'double';
type Framing = 'frameless' | 'semi_frameless' | 'framed';

interface PivotVariant {
  direction: PivotDir;
  framing: Framing;
}

const VARIANTS: PivotVariant[] = [];
for (const direction of ['left', 'right', 'double'] as PivotDir[]) {
  for (const framing of ['frameless', 'semi_frameless', 'framed'] as Framing[]) {
    VARIANTS.push({ direction, framing });
  }
}

function buildPivotPrompt(v: PivotVariant): string {
  const config: Record<string, unknown> = {
    shower_shape: 'standard',
    enclosure_type: 'pivot',
    glass_style: 'clear',
    hardware_finish: 'matte_black',
    handle_style: 'ladder',
    track_preference: v.framing,
    pivot_config: { direction: v.direction },
  };
  return buildVisualizationPromptFromTemplate(config, { catalog: CATALOG }).text;
}

function extractBlock(text: string, startToken: string, endToken: string): string | null {
  const i = text.indexOf(startToken);
  if (i < 0) return null;
  const j = text.indexOf(endToken, i);
  if (j < 0) return text.slice(i);
  return text.slice(i, j + endToken.length);
}

// ---------------------------------------------------------------------------
// Assertion engine
// ---------------------------------------------------------------------------

interface CheckResult {
  variant: PivotVariant;
  passed: string[];
  failed: string[];
}

function checkVariant(v: PivotVariant, prompt: string): CheckResult {
  const passed: string[] = [];
  const failed: string[] = [];

  // Side-specific assertions
  if (v.direction === 'left') {
    requireAll(prompt, passed, failed, [
      'pivot left',
      'vertical pivot axis on the LEFT side',
      'on the RIGHT side of the door panel',
    ]);
  } else if (v.direction === 'right') {
    requireAll(prompt, passed, failed, [
      'pivot right',
      'vertical pivot axis on the RIGHT side',
      'on the LEFT side of the door panel',
    ]);
  } else if (v.direction === 'double') {
    requireAll(prompt, passed, failed, [
      'french-pivot pair',
      'TWO pivot doors',
      'meeting in the center',
      'INNER (center-facing) edge',
    ]);
  }

  // Universal pivot assertions (regardless of side/framing)
  requireAll(prompt, passed, failed, [
    '"type": "pivot"',
    'FULLY CLOSED', // door state lock
    'offset pivot axis', // mechanism
  ]);

  // "no side hinges" — wording varies between single (NOT side hinges) and
  // double (NEVER side hinges); accept either as long as the rule is present
  requireAny(prompt, passed, failed, [
    'NEVER side hinges',
    'NOT side hinges',
  ]);

  // "two pivot points top+bottom" — wording varies between single
  // (two pivot points only — top and bottom) and double (Two pivot points per door)
  requireAny(prompt, passed, failed, [
    'two pivot points only',
    'Two pivot points per door',
  ]);

  // Forbidden_pivot list assertions
  requireAll(prompt, passed, failed, [
    'the pivot door rendered swung OPEN',
    'side-mounted hinges along the vertical edge (this is a pivot, not a hinged door)',
    'a top-mounted slider track or rollers (this is a pivot, not a slider)',
    'pivot hardware on BOTH sides',
  ]);

  // Self-check assertions
  requireAll(prompt, passed, failed, [
    'Is the pivot door rendered FULLY CLOSED',
    'Is the offset pivot axis on the EXACT side requested by the spec?',
    'Is the handle on the side requested by the spec?',
  ]);

  // Framing-specific hardware assertions
  if (v.framing === 'frameless') {
    requireAll(prompt, passed, failed, [
      'NO side hinges anywhere',
      'NO frame, NO U-channel, NO bottom track',
    ]);
  } else if (v.framing === 'semi_frameless') {
    requireAll(prompt, passed, failed, [
      'narrow header bar',
      'offset pivot 4-6 inches from one edge',
    ]);
  } else if (v.framing === 'framed') {
    requireAll(prompt, passed, failed, [
      'full extruded aluminum frame',
      'NO externally visible pivot points',
    ]);
  }

  return { variant: v, passed, failed };
}

function requireAll(
  prompt: string,
  passed: string[],
  failed: string[],
  fragments: string[]
) {
  for (const f of fragments) {
    if (prompt.includes(f)) passed.push(f);
    else failed.push(f);
  }
}

function requireAny(
  prompt: string,
  passed: string[],
  failed: string[],
  fragments: string[]
) {
  const hit = fragments.find((f) => prompt.includes(f));
  if (hit) passed.push(`one-of[${hit}]`);
  else failed.push(`one-of[${fragments.join(' | ')}]`);
}

// ---------------------------------------------------------------------------
// Run all variants
// ---------------------------------------------------------------------------

const results: CheckResult[] = [];
for (const v of VARIANTS) {
  const prompt = buildPivotPrompt(v);
  results.push(checkVariant(v, prompt));
}

let totalFailed = 0;
console.log('\n=== Pivot Visualization Prompt Verification ===\n');
for (const r of results) {
  const label = `pivot ${r.variant.direction.padEnd(6)} × ${r.variant.framing.padEnd(15)}`;
  if (r.failed.length === 0) {
    console.log(`  PASS  ${label}  (${r.passed.length} assertions)`);
  } else {
    totalFailed += r.failed.length;
    console.log(`  FAIL  ${label}  (${r.failed.length} missing)`);
    for (const f of r.failed) {
      console.log(`         missing: ${JSON.stringify(f)}`);
    }
  }
}

console.log(
  `\n${results.length} variants checked, ${
    results.filter((r) => r.failed.length === 0).length
  } pass, ${totalFailed} assertions failed total.\n`
);

if (DUMP) {
  // Print one representative prompt (pivot left + frameless) so you can see what
  // the model actually receives.
  const dumpVariant: PivotVariant = { direction: 'left', framing: 'frameless' };
  const prompt = buildPivotPrompt(dumpVariant);
  const system = getSystemPromptFromTemplate({ catalog: CATALOG }).text;
  console.log('\n=== Sample prompt — pivot LEFT + frameless ===\n');
  console.log('--- System prompt ---');
  console.log(system);
  console.log('\n--- Visualization prompt ---');
  console.log(prompt);
  console.log('\n--- Key pivot fragments only ---');
  console.log(extractBlock(prompt, '"configuration": {', '},') ?? '(no configuration block found)');
  console.log('---');
  console.log(extractBlock(prompt, 'forbidden_elements', ']') ?? '(no forbidden block found)');
  console.log('---');
  console.log(extractBlock(prompt, 'self_check_before_output', ']') ?? '(no self-check block found)');
}

process.exit(totalFailed > 0 ? 1 : 0);
