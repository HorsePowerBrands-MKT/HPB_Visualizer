import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { PromptTemplate } from './types';
import { processTemplate } from './processor';

const minimalTemplate: PromptTemplate = {
  id: 'test',
  name: 'Test',
  version: '1',
  type: 'system',
  description: 'unit test',
  variables: [
    { name: 'color', type: 'string', required: true },
  ],
  sections: [
    {
      id: 'main',
      type: 'custom',
      content: ['Glass color: {{color}}'],
    },
  ],
  metadata: {
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

describe('processTemplate', () => {
  it('interpolates variables into section content', () => {
    const result = processTemplate(minimalTemplate, { color: 'low_iron' }, {});
    assert.ok(result.text.includes('Glass color: low_iron'));
  });
});
