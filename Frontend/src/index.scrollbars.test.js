import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const indexCss = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

describe('global frosted scrollbars', () => {
  it('uses an obsidian root canvas without a visible viewport scrollbar', () => {
    expect(indexCss).toMatch(/html\s*\{[^}]*color-scheme:\s*dark\s*!important;[^}]*background-color:\s*#04080c\s*!important;[^}]*overflow-x:\s*hidden\s*!important;[^}]*scrollbar-width:\s*none\s*!important;/s);
    expect(indexCss).toMatch(/body\s*\{[^}]*background-color:\s*#04080c\s*!important;[^}]*overflow-x:\s*hidden\s*!important;[^}]*scrollbar-width:\s*none\s*!important;/s);
    expect(indexCss).toMatch(/html::-webkit-scrollbar,[\s\S]*?body::-webkit-scrollbar\s*\{[^}]*display:\s*none\s*!important;/);
  });

  it('uses a six-pixel frosted scrollbar with teal interaction states', () => {
    expect(indexCss).toMatch(/::-webkit-scrollbar\s*\{[^}]*width:\s*6px;[^}]*height:\s*6px;/s);
    expect(indexCss).toMatch(/::-webkit-scrollbar-thumb\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.18\).*border-radius:\s*9999px\s*!important;/s);
    expect(indexCss).toMatch(/::-webkit-scrollbar-thumb:hover\s*\{[^}]*background:\s*#2dd4bf/s);
  });

  it('hides modal scroll thumbs until their scroll container is hovered', () => {
    expect(indexCss).toMatch(/\.tour-modal::-webkit-scrollbar-thumb,[\s\S]*?background:\s*transparent\s*!important;/);
    expect(indexCss).toMatch(/\.tour-modal:hover::-webkit-scrollbar-thumb,[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.22\)\s*!important;/);
  });
});
