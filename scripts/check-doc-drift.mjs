#!/usr/bin/env node
/**
 * Fail CI when required agent docs or cross-links are missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredFiles = [
  'AGENTS.md',
  'ARCHITECTURE.md',
  'docs/CONVENTIONS.md',
  'docs/PATTERNS.md',
  'docs/README.md',
  '.github/pull_request_template.md',
  '.github/workflows/ci.yml',
];

const readmeMustLink = ['AGENTS.md', 'docs/README.md'];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

let failed = false;

for (const rel of requiredFiles) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`[check:docs] missing required file: ${rel}`);
    failed = true;
  }
}

if (!failed) {
  const readme = read('README.md');
  for (const link of readmeMustLink) {
    if (!readme.includes(link)) {
      console.error(`[check:docs] README.md must link to ${link}`);
      failed = true;
    }
  }

  const agents = read('AGENTS.md');
  const agentsMustMention = ['hpb-ticket-plan', 'hpb-pr-copilot', 'pnpm typecheck', 'check:docs'];
  for (const phrase of agentsMustMention) {
    if (!agents.includes(phrase)) {
      console.error(`[check:docs] AGENTS.md must mention: ${phrase}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log('[check:docs] OK');
