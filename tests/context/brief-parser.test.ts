import { describe, it, expect } from 'vitest';
import { parseBrief, slugify } from '../../src/context/brief-parser.js';

describe('slugify', () => {
  it('converts text to URL-safe slug', () => {
    expect(slugify('E-ticaret Platformu')).toBe('e-ticaret-platformu');
  });

  it('handles special characters', () => {
    expect(slugify('Next.js + React')).toBe('nextjs-react');
  });

  it('truncates long slugs', () => {
    const long = 'a'.repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(50);
  });

  it('converts to lowercase', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world test')).toBe('hello-world-test');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('hello--world---test')).toBe('hello-world-test');
  });

  it('removes special characters', () => {
    expect(slugify('hello@world#test!')).toBe('helloworldtest');
  });
});

describe('parseBrief', () => {
  it('structures a simple brief', () => {
    const result = parseBrief('E-ticaret platformu, Next.js, multi-tenant');
    expect(result.raw).toBe('E-ticaret platformu, Next.js, multi-tenant');
    expect(result.slug).toMatch(/e-ticaret-platformu/);
  });

  it('generates slug from first comma-separated segment', () => {
    const result = parseBrief('Mobile App, React Native, iOS');
    expect(result.slug).toBe('mobile-app');
  });

  it('includes date in YYYY-MM-DD format', () => {
    const result = parseBrief('Test project, some details');
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(result.date).toMatch(dateRegex);
  });

  it('uses default outputBase when not provided', () => {
    const result = parseBrief('Test project, details');
    expect(result.outputDir).toMatch(/^output\/\d{4}-\d{2}-\d{2}-/);
  });

  it('uses custom outputBase when provided', () => {
    const result = parseBrief('Test project, details', 'custom');
    expect(result.outputDir).toMatch(/^custom\/\d{4}-\d{2}-\d{2}-/);
  });

  it('constructs outputDir as ${outputBase}/${date}-${slug}', () => {
    const result = parseBrief('Hello World, test', 'myoutput');
    expect(result.outputDir).toMatch(/^myoutput\/\d{4}-\d{2}-\d{2}-hello-world$/);
  });
});
