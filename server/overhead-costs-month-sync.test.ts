import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb } from './db';
import { upsertUser } from './db';
import { upsertOverheadCosts, getOverheadCostsByMonth } from './db';
import { eq } from 'drizzle-orm';
import { overheadCosts as overheadCostsTable } from '../drizzle/schema';

describe('Overhead Costs - Month Synchronization', () => {
  const testUserId = 999;
  const testUser = {
    openId: 'test-overhead-sync-' + Date.now(),
    name: 'Test User',
    email: 'test-overhead-sync@example.com',
  };

  beforeEach(async () => {
    await upsertUser(testUser);
  });

  afterEach(async () => {
    const db = await getDb();
    if (db) {
      await db
        .delete(overheadCostsTable)
        .where(eq(overheadCostsTable.userId, testUserId));
    }
  });

  it('should save overhead costs for June 2026 correctly', async () => {
    const juneData = {
      userId: testUserId,
      month: 6,
      year: 2026,
      rent: '1500',
      salaries: '2000',
      electricity: '300',
      others: '200',
    };

    const result = await upsertOverheadCosts(juneData);
    expect(result).toBeDefined();

    const retrieved = await getOverheadCostsByMonth(testUserId, 6, 2026);
    expect(retrieved).toBeDefined();
    expect(retrieved?.month).toBe(6);
    expect(retrieved?.year).toBe(2026);
    expect(retrieved?.rent).toBe('1500.00');
    expect(retrieved?.salaries).toBe('2000.00');
    expect(retrieved?.electricity).toBe('300.00');
    expect(retrieved?.others).toBe('200.00');
  });

  it('should not confuse June costs with May costs', async () => {
    const mayData = {
      userId: testUserId,
      month: 5,
      year: 2026,
      rent: '1000',
      salaries: '1500',
      electricity: '250',
      others: '100',
    };

    const juneData = {
      userId: testUserId,
      month: 6,
      year: 2026,
      rent: '1500',
      salaries: '2000',
      electricity: '300',
      others: '200',
    };

    // Save both May and June costs
    await upsertOverheadCosts(mayData);
    await upsertOverheadCosts(juneData);

    // Retrieve May costs
    const mayRetrieved = await getOverheadCostsByMonth(testUserId, 5, 2026);
    expect(mayRetrieved?.month).toBe(5);
    expect(mayRetrieved?.rent).toBe('1000.00');

    // Retrieve June costs
    const juneRetrieved = await getOverheadCostsByMonth(testUserId, 6, 2026);
    expect(juneRetrieved?.month).toBe(6);
    expect(juneRetrieved?.rent).toBe('1500.00');

    // Verify they are different
    expect(mayRetrieved?.rent).not.toBe(juneRetrieved?.rent);
  });

  it('should update existing June costs instead of creating duplicates', async () => {
    const juneData1 = {
      userId: testUserId,
      month: 6,
      year: 2026,
      rent: '1500',
      salaries: '2000',
      electricity: '300',
      others: '200',
    };

    const juneData2 = {
      userId: testUserId,
      month: 6,
      year: 2026,
      rent: '1600',
      salaries: '2100',
      electricity: '350',
      others: '250',
    };

    // Save June costs first time
    await upsertOverheadCosts(juneData1);
    let retrieved = await getOverheadCostsByMonth(testUserId, 6, 2026);
    expect(retrieved?.rent).toBe('1500.00');

    // Save June costs again with different values
    await upsertOverheadCosts(juneData2);
    retrieved = await getOverheadCostsByMonth(testUserId, 6, 2026);

    // Should be updated, not duplicated
    expect(retrieved?.rent).toBe('1600.00');
    expect(retrieved?.salaries).toBe('2100.00');
  });
});
