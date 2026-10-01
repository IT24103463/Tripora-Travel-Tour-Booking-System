import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { formatLocation, parseAmenities } from './TourDisplay';

const tourDisplaySource = readFileSync(resolve(process.cwd(), 'src/components/TourDisplay.jsx'), 'utf8');

describe('parseAmenities', () => {
  it('normalizes array, JSON, and comma-separated amenities into clean badge labels', () => {
    expect(parseAmenities([' Infinity Pool ', 'Ayurvedic Spa'])).toEqual([
      'Infinity Pool',
      'Ayurvedic Spa',
    ]);
    expect(parseAmenities('["Infinity Pool", "Ayurvedic Spa"]')).toEqual([
      'Infinity Pool',
      'Ayurvedic Spa',
    ]);
    expect(parseAmenities('Infinity Pool, Ayurvedic Spa')).toEqual([
      'Infinity Pool',
      'Ayurvedic Spa',
    ]);
  });

  it('renders parsed amenities as modal tags instead of the raw hotel value', () => {
    expect(tourDisplaySource).toContain('className="modal-amenities-wrap"');
    expect(tourDisplaySource).toContain('parseAmenities(selectedItem?.amenities)');
  });
});

describe('formatLocation', () => {
  it('converts legacy all-caps locations to title case for the card eyebrow', () => {
    expect(formatLocation('KITULGALA, SABARAGAMUWA PROVINCE')).toBe('Kitulgala, Sabaragamuwa Province');
  });
});
