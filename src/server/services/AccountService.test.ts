import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/index.js';
import { AccountService } from './AccountService.js';

describe('AccountService', () => {
  let service: AccountService;
  beforeEach(() => { service = new AccountService(createTestDb()); });

  it('returns empty list initially', () => {
    expect(service.getAll()).toHaveLength(0);
  });

  it('creates an account', () => {
    const acc = service.create('Bank Leumi');
    expect(acc.name).toBe('Bank Leumi');
    expect(acc.currency).toBe('ILS');
    expect(service.getAll()).toHaveLength(1);
  });

  it('findOrCreate returns existing account', () => {
    const a = service.findOrCreate('Bank Leumi');
    const b = service.findOrCreate('Bank Leumi');
    expect(a.id).toBe(b.id);
    expect(service.getAll()).toHaveLength(1);
  });

  it('getById returns null for unknown id', () => {
    expect(service.getById('unknown')).toBeNull();
  });
});
