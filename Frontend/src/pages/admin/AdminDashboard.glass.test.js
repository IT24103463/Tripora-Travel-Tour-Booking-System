import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  resolve(process.cwd(), 'src/pages/admin/AdminDashboard.css'),
  'utf8'
);

describe('AdminDashboard proportional crystalline glass', () => {
  it('anchors a 240px navigation rail to the full-height deck', () => {
    expect(css).toMatch(/\.crystalline-deck-layout\s*\{[\s\S]*?min-height:\s*calc\(100vh\s*-\s*100px\)/);
    expect(css).toMatch(/\.floating-nav-rail\s*\{[\s\S]*?width:\s*240px;/);
    expect(css).toMatch(/\.floating-nav-rail\s*\{[\s\S]*?background:\s*rgba\(6,\s*12,\s*22,\s*\.24\)/);
  });

  it('gives metrics and the ledger balanced translucent dimensions', () => {
    expect(css).toMatch(/\.bento-metric-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
    expect(css).toMatch(/\.bento-glass-card\s*\{[\s\S]*?min-height:\s*115px;/);
    expect(css).toMatch(/\.bento-glass-card\s*\{[\s\S]*?padding:\s*20px\s+24px;/);
    expect(css).toMatch(/\.bento-glass-card\s*\{[\s\S]*?background:\s*rgba\(15,\s*23,\s*42,\s*\.65\)/);
    expect(css).toMatch(/\.ledger-container\s*\{[\s\S]*?background:\s*rgba\(6,\s*12,\s*22,\s*\.22\)/);
  });
});
