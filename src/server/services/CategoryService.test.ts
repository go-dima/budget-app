import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/index.js';
import { CategoryService } from './CategoryService.js';

describe('CategoryService', () => {
  let service: CategoryService;
  beforeEach(() => { service = new CategoryService(createTestDb()); });

  it('returns empty list initially', () => {
    expect(service.getAll()).toHaveLength(0);
  });

  it('creates category on findOrCreate', () => {
    const cat = service.findOrCreate('מזון');
    expect(cat.name).toBe('מזון');
    expect(cat.type).toBe('expense');
  });

  it('returns same category on duplicate findOrCreate', () => {
    const a = service.findOrCreate('מזון');
    const b = service.findOrCreate('מזון');
    expect(a.id).toBe(b.id);
    expect(service.getAll()).toHaveLength(1);
  });
});
