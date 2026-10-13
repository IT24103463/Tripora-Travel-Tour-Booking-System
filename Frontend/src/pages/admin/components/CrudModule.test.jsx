import { describe, expect, it } from 'vitest';
import { sortRecordsByStatus } from './CrudModule';

describe('sortRecordsByStatus', () => {
  it('keeps active records first and sorts each status group newest first', () => {
    const records = [
      { id: 'old-inactive', isActive: false, createdAt: '2026-01-01T00:00:00Z' },
      { id: 'new-active', isActive: true, createdAt: '2026-03-01T00:00:00Z' },
      { id: 'old-active', status: 'Active', createdAt: '2026-02-01T00:00:00Z' },
      { id: 'new-inactive', status: 'Inactive', createdAt: '2026-04-01T00:00:00Z' },
    ];

    expect(sortRecordsByStatus(records).map((record) => record.id)).toEqual([
      'new-active',
      'old-active',
      'new-inactive',
      'old-inactive',
    ]);
  });

  it('does not mutate the records held in component state', () => {
    const records = [
      { id: 'inactive', isActive: false },
      { id: 'active', isActive: true },
    ];

    expect(sortRecordsByStatus(records).map((record) => record.id)).toEqual(['active', 'inactive']);

    expect(records.map((record) => record.id)).toEqual(['inactive', 'active']);
  });
});
