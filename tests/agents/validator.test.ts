import { describe, it, expect } from 'vitest';
import { validateOutput } from '../../src/agents/validator.js';

describe('validateOutput', () => {
  it('returns valid when no schema is defined', () => {
    const result = validateOutput({ foo: 'bar' }, undefined);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid when output is null', () => {
    const schema = { type: 'object', properties: {}, required: [] };
    const result = validateOutput(null, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('No structured output found');
  });

  it('detects missing required fields', () => {
    const schema = {
      type: 'object',
      required: ['tech_stack', 'risks'],
      properties: {
        tech_stack: { type: 'string' },
        risks: { type: 'array' },
      },
    };
    const result = validateOutput({ tech_stack: 'Node.js' }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: risks');
    expect(result.errors).not.toContain('Missing required field: tech_stack');
  });

  it('detects type mismatches (expected array, got string)', () => {
    const schema = {
      type: 'object',
      required: ['risks'],
      properties: {
        risks: { type: 'array' },
      },
    };
    const result = validateOutput({ risks: 'high risk' }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Field 'risks' expected array but got string");
  });

  it('passes when all required fields are present with correct types', () => {
    const schema = {
      type: 'object',
      required: ['tech_stack', 'risks', 'score'],
      properties: {
        tech_stack: { type: 'string' },
        risks: { type: 'array' },
        score: { type: 'number' },
      },
    };
    const result = validateOutput(
      { tech_stack: 'Node.js', risks: ['security', 'scale'], score: 8 },
      schema,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('ignores extra fields not in schema', () => {
    const schema = {
      type: 'object',
      required: ['summary'],
      properties: {
        summary: { type: 'string' },
      },
    };
    const result = validateOutput(
      { summary: 'All good', extra_field: 'ignored', another: 42 },
      schema,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects multiple errors at once', () => {
    const schema = {
      type: 'object',
      required: ['name', 'tags', 'count'],
      properties: {
        name: { type: 'string' },
        tags: { type: 'array' },
        count: { type: 'number' },
      },
    };
    // 'name' is missing entirely, 'tags' is wrong type, 'count' is present and correct
    const result = validateOutput({ tags: 'one,two', count: 3 }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: name');
    expect(result.errors).toContain("Field 'tags' expected array but got string");
    expect(result.errors).toHaveLength(2);
  });

  it('correctly identifies array type (not confused with object)', () => {
    const schema = {
      type: 'object',
      required: ['items'],
      properties: {
        items: { type: 'array' },
      },
    };
    const result = validateOutput({ items: [1, 2, 3] }, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports type mismatch for object field given a number', () => {
    const schema = {
      type: 'object',
      required: ['metadata'],
      properties: {
        metadata: { type: 'object' },
      },
    };
    const result = validateOutput({ metadata: 42 }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Field 'metadata' expected object but got number");
  });
});
