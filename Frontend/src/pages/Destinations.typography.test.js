import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const destinationsCss = readFileSync(
  resolve(process.cwd(), 'src/pages/Destinations.css'),
  'utf8',
);
const indexHtml = readFileSync(
  resolve(process.cwd(), 'index.html'),
  'utf8',
);
const tourDisplay = readFileSync(
  resolve(process.cwd(), 'src/components/TourDisplay.jsx'),
  'utf8',
);
const travelPackages = readFileSync(
  resolve(process.cwd(), 'src/pages/TravelPackages.jsx'),
  'utf8',
);
const unifiedSearchCssPath = resolve(process.cwd(), 'src/components/UnifiedSearchBar.css');
const unifiedSearchCss = existsSync(unifiedSearchCssPath)
  ? readFileSync(unifiedSearchCssPath, 'utf8')
  : '';

describe('Destinations typography', () => {
  it('applies Playfair Display only to the master heading', () => {
    expect(indexHtml).toContain('family=Playfair+Display');
    expect(tourDisplay).toContain('className="tour-title destinations-header-title"');
    expect(destinationsCss).toMatch(
      /\.destinations-header-title\s*\{[^}]*font-family:\s*'Playfair Display', Georgia, 'Times New Roman', serif\s*!important;/s,
    );
  });

  it('uses the same unified search markup and stylesheet on both pages', () => {
    for (const pageSource of [tourDisplay, travelPackages]) {
      expect(pageSource).toContain('unified-search-bar-console');
      expect(pageSource).toContain('unified-search-pill');
      expect(pageSource).toContain('unified-clear-filters-btn');
      expect(pageSource).toContain("UnifiedSearchBar.css");
    }

    expect(unifiedSearchCss).toMatch(
      /\.unified-search-pill\s*\{[^}]*height:\s*44px;[^}]*border-radius:\s*9999px;/s,
    );
    expect(unifiedSearchCss).toMatch(
      /\.unified-search-pill input\s*\{[^}]*font-size:\s*0\.85rem;[^}]*color:\s*#94a3b8;/s,
    );
  });

  it('copies Travel Packages card-title markup and typography for both tour and hotel cards', () => {
    const sharedCardClasses = [
      'tour-content',
      'destination-location-eyebrow',
      'destination-card-title',
      'tour-description',
      'tour-details',
      'tour-detail',
      'tour-footer',
    ];

    for (const className of sharedCardClasses) {
      expect(tourDisplay.match(new RegExp(`className=\\"${className}`, 'g'))?.length).toBeGreaterThanOrEqual(2);
    }

    expect(destinationsCss).toMatch(
      /\.tour-display-container \.destination-card-title\s*\{[^}]*margin:\s*0;[^}]*color:\s*#ffffff\s*!important;[^}]*font-family:\s*Georgia, 'Times New Roman', serif;[^}]*font-size:\s*1\.25rem;[^}]*font-weight:\s*700;[^}]*letter-spacing:\s*-0\.025em;[^}]*line-height:\s*1\.35;[^}]*text-shadow:\s*0 1px 2px rgba\(0, 0, 0, 0\.65\);/s,
    );

    expect(destinationsCss).toMatch(
      /\.tour-display-container \.destination-location-eyebrow\s*\{[^}]*color:\s*#9be4d8;[^}]*font-size:\s*0\.66rem;[^}]*font-weight:\s*750;[^}]*letter-spacing:\s*0\.02em;[^}]*text-transform:\s*none;/s,
    );
  });
});
