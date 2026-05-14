/**
 * Regression check: replay every reported issue's configuration against the
 * NEW prompts and verify the relevant constraint is present.
 *
 * This is a STATIC check (no live API calls). For each of the 51 issue
 * reports:
 *   1. Look up the configuration that was used (from visualizations_rows).
 *   2. Render the new prompt using that configuration.
 *   3. Assert that the prompt now contains the specific rule/forbidden item
 *      that addresses the reported failure mode.
 *
 * If every cluster's assertion passes, the new prompt at least surfaces the
 * right negative example to the model. Live regenerations are still needed
 * to confirm the model honors them, but this catches regressions where a
 * later edit silently removes a constraint we added for a known issue.
 *
 * Run with:
 *   npx tsx scripts/verify_issue_clusters.ts \
 *     [issue_reports_rows.json] [visualizations_rows.json]
 *
 * Defaults to the user's Downloads folder.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  registerBrandTemplates,
  buildVisualizationPromptFromTemplate,
  buildInspirationPromptFromTemplate,
  getSystemPromptFromTemplate,
} from '../packages/prompt-templates/src/index';
import {
  gatsbyGlassTemplates,
  gatsbyGlassRegistry,
} from '../apps/gatsby-glass/prompts/gatsby-templates';
import { CATALOG } from '../apps/gatsby-glass/lib/gatsby-constants/src/catalog';

registerBrandTemplates(gatsbyGlassTemplates, gatsbyGlassRegistry);

interface IssueReport {
  id: string;
  session_id: string;
  message: string;
  team: string | null;
  created_at: string;
}

interface VisualizationRow {
  id: string;
  session_id: string;
  generation_index: number;
  mode: 'configure' | 'inspiration';
  enclosure_type: string;
  hardware_finish: string;
  handle_style: string;
  framing_style: string;
  shower_shape: string;
  hinged_config: string | null;
  pivot_config: string | null;
  sliding_config: string | null;
  created_at: string;
}

const ISSUES_PATH =
  process.argv[2] || '/Users/johnpfeiffer/Downloads/issue_reports_rows.json';
const VIS_PATH =
  process.argv[3] || '/Users/johnpfeiffer/Downloads/visualizations_rows.json';

const issues: IssueReport[] = JSON.parse(fs.readFileSync(ISSUES_PATH, 'utf-8'));
const visualizations: VisualizationRow[] = JSON.parse(
  fs.readFileSync(VIS_PATH, 'utf-8')
);

// Index visualizations by session_id (latest generation wins, since the issue
// is reported about the most recent render in a session).
const bySession = new Map<string, VisualizationRow>();
for (const v of visualizations) {
  const existing = bySession.get(v.session_id);
  if (!existing || (v.generation_index ?? 0) >= (existing.generation_index ?? 0)) {
    bySession.set(v.session_id, v);
  }
}

function parseConfig(json: string | null): Record<string, unknown> | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function buildPromptForVis(v: VisualizationRow): string {
  if (v.mode === 'inspiration') {
    return buildInspirationPromptFromTemplate(v.shower_shape || 'standard', {
      catalog: CATALOG,
    }).text;
  }
  // The framing column is `framing_style` in the table but the template
  // variable name is `track_preference`.
  const config: Record<string, unknown> = {
    shower_shape: v.shower_shape,
    enclosure_type: v.enclosure_type,
    glass_style: 'clear', // not in visualizations table; default to clear for testing
    hardware_finish: v.hardware_finish,
    handle_style: v.handle_style,
    track_preference: v.framing_style,
    hinged_config: parseConfig(v.hinged_config),
    pivot_config: parseConfig(v.pivot_config),
    sliding_config: parseConfig(v.sliding_config),
  };
  return buildVisualizationPromptFromTemplate(config, { catalog: CATALOG }).text;
}

// ---------------------------------------------------------------------------
// Cluster classifiers — each returns (matches, requiredFragments)
// ---------------------------------------------------------------------------

interface ClusterRule {
  /** Human-readable cluster label used in the report. */
  label: string;
  /** Predicate: does this issue belong to this cluster? */
  matches: (msg: string) => boolean;
  /**
   * Substrings the rendered prompt MUST contain to be considered "addressed."
   * All must be present (AND) in at least one rendered prompt for that issue.
   * For multi-prompt issues (configure + system), we concat both.
   */
  required: string[];
  /**
   * Optional: only apply to a subset of mode/enclosure/framing combinations.
   * Returns true if the rule is applicable to a given visualization.
   */
  applicableTo?: (v: VisualizationRow) => boolean;
}

const lower = (s: string) => s.toLowerCase();

const RULES: ClusterRule[] = [
  // Door-type confusion: anywhere "hinge" + "slider/sliding" co-occur
  {
    label: 'door-type-confusion-asked-hinged-got-slider',
    matches: (m) =>
      /(hinge[ds]?\b.*\b(slider|sliding)|(slider|sliding)\b.*\bhinge[ds]?\b|swing.*sliding|sliding.*swing)/i.test(
        m
      ),
    required: [
      '"a top-mounted slider track or rail (this is a hinged door, not a slider)"',
    ],
    applicableTo: (v) => v.enclosure_type === 'hinged',
  },
  // Door-type confusion: pivot + slider/sliding co-occur in either order
  {
    label: 'door-type-confusion-asked-pivot-got-slider',
    matches: (m) =>
      /(pivot\b.*\b(slider|sliding)|(slider|sliding)\b.*\bpivot)/i.test(m),
    required: [
      '"a top-mounted slider track or rollers (this is a pivot, not a slider)"',
    ],
    applicableTo: (v) => v.enclosure_type === 'pivot',
  },
  // Sliding rendered when user asked hinged+framed or pivot+framed
  {
    label: 'door-type-confusion-framed-rendered-as-slider',
    matches: (m) =>
      /supposed to be (a )?(framed )?(door )?(swing|hinge|pivot).*sliding|generated.*sliding|sliding.*generated|exposed roller/i.test(
        m
      ),
    required: [],
    applicableTo: (v) => v.enclosure_type !== 'sliding',
  },
  {
    label: 'door-type-confusion-swing-direction-wrong',
    matches: (m) =>
      /swing right.*swinging left|swing left.*swinging right|chose swing.*it'?s? swinging|hinge right.*slider|swing direction/i.test(
        m
      ),
    required: ['"swing_direction"'],
  },
  // Hinges placed on the wrong side of the door (e.g. asked right swing, hinges on left)
  {
    label: 'hinges-on-wrong-side',
    matches: (m) =>
      /hinges on (both|the (left|right))|two hinges (to|on) the (left|right)|hinging on (the )?wall|hinges on both walls/i.test(
        m
      ),
    required: [
      '"hinges shown on BOTH sides of the door (hinges live on ONE side only)"',
    ],
    applicableTo: (v) => v.enclosure_type === 'hinged',
  },

  // Frameless rendered as framed
  {
    label: 'frameless-rendered-as-framed',
    matches: (m) =>
      /frameless.*(fully|completely)?\s*framed|framed.*frameless|frame.*three sides|asked for frameless|requested frameless/i.test(
        m
      ),
    required: [
      '"a frame on three sides of the enclosure (this is the most common frameless rendering error — it is FORBIDDEN)"',
      '"any aluminum U-channel along walls, base, top, or curb (frameless means NO channels)"',
    ],
    applicableTo: (v) => v.framing_style === 'frameless',
  },

  // Curtain / curtain rod left in
  {
    label: 'curtain-or-rod-left-visible',
    matches: (m) =>
      /shower curtain rod|curtain rod still|rod still remains|same color as the hardware|still has shower curtain/i.test(
        m
      ),
    required: [
      '"any existing shower curtain rod (do NOT recolor it to match new hardware)"',
      '"shower curtain or curtain rod left visible — even if recolored, repainted, or restyled"',
    ],
  },

  // Plumbing / fixture mirroring or duplication
  {
    label: 'fixture-duplicated-or-mirrored',
    matches: (m) =>
      /shower head on (the )?(left|right) (and|but).*right|both the left and the right|two shower heads|added another shower head|extra faucet|additional faucet|on the wrong side|plumbing.*(left|right) side|placed.*on the (left|right)/i.test(
        m
      ),
    required: [
      '"duplicated, mirrored, or relocated shower head, faucet, valve, or any plumbing"',
    ],
  },

  // Wrong handle style or handle substituted, mismatched handles, missing handle
  {
    label: 'wrong-handle-or-substitute',
    matches: (m) =>
      /ladder pull|towel bar|generated.*(square|knob|crescent|cresent|d[- ]?pull) handle|generated.*with a (square|knob|d[- ]?pull|ladder)|knobs.*different sizes|handles? .*not the same|two different (types of )?handles|did not (select|generate) (a )?(square|knob|ladder|d[- ]?pull|crescent) handle|did not generate knobs|provided one towel bar and one knob|one towel bar|hardware is wrong/i.test(
        m
      ),
    required: [
      '"different handle styles or sizes between panels of the same enclosure"',
    ],
  },
  // Sliding handle/end-protection only on one side
  {
    label: 'sliding-asymmetric-hardware',
    matches: (m) =>
      /end protection on one side|handle.*only.*one (panel|side)|defaults to a towel bar/i.test(
        m
      ),
    required: [
      '"handles at the center seam where the two panels meet (handles only on the OUTER edges)"',
    ],
    applicableTo: (v) => v.enclosure_type === 'sliding',
  },

  // To-ceiling not honored
  {
    label: 'to-ceiling-not-honored',
    matches: (m) =>
      /to the ceiling|go to the ceiling|extend.*ceiling|asked.*ceiling/i.test(
        m
      ),
    required: ['"height": "floor to ceiling'],
    applicableTo: (v) => {
      const h = parseConfig(v.hinged_config) as { to_ceiling?: boolean } | null;
      return v.enclosure_type === 'hinged' && Boolean(h?.to_ceiling);
    },
  },

  // Asked double, got single (or vice versa)
  {
    label: 'asked-double-got-single',
    matches: (m) =>
      /asked for a double|double door.*only one|asked.*double.*got only one|generated one door|two double door/i.test(
        m
      ),
    required: ['"is_double": true'],
    applicableTo: (v) => {
      const h = parseConfig(v.hinged_config) as { direction?: string } | null;
      const p = parseConfig(v.pivot_config) as { direction?: string } | null;
      const s = parseConfig(v.sliding_config) as
        | { configuration?: string }
        | null;
      return (
        h?.direction === 'double' ||
        p?.direction === 'double' ||
        s?.configuration === 'double'
      );
    },
  },

  // Inspiration bleed-through
  {
    label: 'inspiration-bleed-through',
    matches: (m) =>
      /inspo|inspiration|reposition.*toilet|moved the toilet|served the inspo|merged my shower with the inspo|elements.*not for my shower|inspiration picture|wall cut out/i.test(
        m
      ),
    required: [
      '"returning input_2 itself or any crop/recolor of input_2 as the output"',
      '"merging input_1 and input_2 into a hybrid bathroom"',
    ],
    applicableTo: (v) => v.mode === 'inspiration',
  },

  // Hardware artifacts (clamps that don't attach, channel behind hinge, three sets of rollers, hinges both sides)
  {
    label: 'hardware-artifact-clamp-or-channel',
    matches: (m) =>
      /glass clamp on top|glass clamp.*cannot attach|channel behind the hinges|three sets of rollers|clamps down|hinges on both walls|two clamps/i.test(
        m
      ),
    required: [
      '"any glass clamp not actually attached to a glass panel or solid wall (no floating clamps)"',
    ],
  },

  // Sliding rendered open
  {
    label: 'sliding-rendered-open',
    matches: (m) =>
      /shower door is slid open|slid open|left door open|partially open/i.test(
        m
      ),
    required: [
      '"sliding doors rendered OPEN with one panel hidden behind the other (always render FULLY CLOSED with both panels visible)"',
    ],
    applicableTo: (v) => v.enclosure_type === 'sliding',
  },
  // Tile or background not preserved from input
  // Matches both configure-mode ("all wall tile pattern, color, and grout lines")
  // and inspiration-mode ("all wall tile pattern, color, grout — exactly as input_1") wording.
  {
    label: 'tile-or-background-not-preserved',
    matches: (m) =>
      /tile in the background|did not have the right tile|grid pattern (does not|doesn'?t) match|wall.*not consistent|cutouts in my shower|wall cut out/i.test(
        m
      ),
    required: ['"all wall tile pattern, color'],
  },
  // Closed-curtain plumbing handling — model omitted shower head when curtain fully closed
  {
    label: 'closed-curtain-plumbing-omitted',
    matches: (m) =>
      /closed shower curtain|completely closed.*curtain|did not (serve|generate|provide).*shower head|no shower head|shower head.*not.*generated/i.test(
        m
      ),
    required: [
      'fully closed and hides the fixtures, place a single typical wall-mounted shower head',
    ],
  },

  // Quota errors — not addressed by prompt; addressed by retry layer
  {
    label: 'quota-resource-exhausted-handled-by-retry-layer',
    matches: (m) => /RESOURCE_EXHAUSTED|quota|429/i.test(m),
    required: [], // No prompt assertion; flag separately as handled by retry/backoff
  },
];

// ---------------------------------------------------------------------------
// Run the checks
// ---------------------------------------------------------------------------

interface IssueResult {
  issueId: string;
  sessionId: string;
  message: string;
  matchedClusters: string[];
  unmatchedClusters: string[];
  noVisualizationRow: boolean;
  failures: { cluster: string; missing: string[] }[];
}

const results: IssueResult[] = [];
const clusterCounts = new Map<string, { total: number; passed: number; skipped: number }>();
for (const r of RULES) clusterCounts.set(r.label, { total: 0, passed: 0, skipped: 0 });

for (const issue of issues) {
  const vis = bySession.get(issue.session_id);
  const result: IssueResult = {
    issueId: issue.id,
    sessionId: issue.session_id,
    message: issue.message,
    matchedClusters: [],
    unmatchedClusters: [],
    noVisualizationRow: !vis,
    failures: [],
  };

  if (!vis) {
    // Issue's session isn't in the visualizations export. We can still match
    // clusters by message text — required-fragment checks just won't run.
    for (const rule of RULES) {
      if (rule.matches(lower(issue.message))) {
        result.matchedClusters.push(rule.label);
        const counts = clusterCounts.get(rule.label)!;
        counts.total += 1;
        counts.skipped += 1;
      }
    }
    results.push(result);
    continue;
  }

  const visualizationPrompt = buildPromptForVis(vis);
  const systemPrompt = getSystemPromptFromTemplate({ catalog: CATALOG }).text;
  const combined = `${systemPrompt}\n\n${visualizationPrompt}`;

  for (const rule of RULES) {
    if (!rule.matches(lower(issue.message))) continue;
    const counts = clusterCounts.get(rule.label)!;
    counts.total += 1;
    if (rule.applicableTo && !rule.applicableTo(vis)) {
      // Rule isn't applicable to this configuration (e.g., user reported
      // frameless issue but the visualization was actually framed). Don't
      // count as failure — the cluster is detected from text but the
      // configuration doesn't match, so the constraint isn't expected.
      counts.skipped += 1;
      result.matchedClusters.push(`${rule.label} (skipped: not applicable)`);
      continue;
    }

    if (rule.required.length === 0) {
      // No prompt assertion for this cluster (e.g., quota errors are handled
      // by the retry layer, not the prompt).
      counts.passed += 1;
      result.matchedClusters.push(`${rule.label} (handled outside prompt)`);
      continue;
    }

    // Required: every fragment must appear in the combined prompt.
    const missing = rule.required.filter((frag) => !combined.includes(frag));
    if (missing.length === 0) {
      counts.passed += 1;
      result.matchedClusters.push(rule.label);
    } else {
      result.failures.push({ cluster: rule.label, missing });
    }
  }
  results.push(result);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log('================================================================');
console.log('  Issue-cluster regression report (static — no live API calls)  ');
console.log('================================================================');
console.log(`Total issues:          ${issues.length}`);
console.log(`Issues with vis row:   ${results.filter((r) => !r.noVisualizationRow).length}`);
console.log(`Issues without:        ${results.filter((r) => r.noVisualizationRow).length}`);
console.log('');
console.log('Cluster summary:');
console.log('---------------------------------------------------------------');
let allPassed = true;
for (const [label, counts] of clusterCounts) {
  if (counts.total === 0) continue;
  const passLabel =
    counts.passed === counts.total - counts.skipped ? 'OK' : 'FAIL';
  if (passLabel === 'FAIL') allPassed = false;
  console.log(
    `  [${passLabel}] ${label.padEnd(50)}  ${counts.passed}/${
      counts.total - counts.skipped
    } (${counts.skipped} skipped)`
  );
}
console.log('');

const failingIssues = results.filter((r) => r.failures.length > 0);
if (failingIssues.length > 0) {
  console.log('Issues with missing prompt constraints:');
  console.log('---------------------------------------------------------------');
  for (const fi of failingIssues) {
    console.log(`  Issue ${fi.issueId} (session ${fi.sessionId}):`);
    console.log(`    "${fi.message.substring(0, 110)}${fi.message.length > 110 ? '...' : ''}"`);
    for (const f of fi.failures) {
      console.log(`    - cluster: ${f.cluster}`);
      for (const m of f.missing) {
        console.log(`        missing: ${m}`);
      }
    }
  }
}

const unmatched = results.filter(
  (r) => r.matchedClusters.length === 0 && r.failures.length === 0
);
if (unmatched.length > 0) {
  console.log('');
  console.log('Issues not classified into any known cluster:');
  console.log('---------------------------------------------------------------');
  for (const u of unmatched) {
    console.log(
      `  Issue ${u.issueId}: "${u.message.substring(0, 110)}${u.message.length > 110 ? '...' : ''}"`
    );
  }
}

console.log('');
console.log(`Result: ${allPassed ? 'PASS' : 'FAIL'}`);
process.exit(allPassed ? 0 : 1);
