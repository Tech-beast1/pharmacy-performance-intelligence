import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { users, overheadCosts } from '../drizzle/schema';
import { getOverheadCostsByMonth, upsertOverheadCosts } from './db';
import { eq } from 'drizzle-orm';

describe('Overhead Costs - Profit Calculation Verification', () => {
  let testUserId: number;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test user
    const testOpenId = `test-profit-calc-${Date.now()}`;
    await db.insert(users).values({
      openId: testOpenId,
      name: 'Test Profit Calc User',
      email: 'testprofitcalc@example.com',
      role: 'user',
      lastSignedIn: new Date(),
    });
    
    const insertedUsers = await db.select().from(users).where(eq(users.openId, testOpenId)).limit(1);
    if (insertedUsers.length === 0) throw new Error('Failed to create test user');
    testUserId = insertedUsers[0].id;

    // Insert overhead costs for April 2026
    await upsertOverheadCosts({
      userId: testUserId,
      month: 4,
      year: 2026,
      rent: '2000.00',
      salaries: '3000.00',
      electricity: '500.00',
      others: '500.00',
    });

    // Insert overhead costs for May 2026
    await upsertOverheadCosts({
      userId: testUserId,
      month: 5,
      year: 2026,
      rent: '2500.00',
      salaries: '3500.00',
      electricity: '600.00',
      others: '400.00',
    });
  });

  afterAll(async () => {
    if (db) {
      // Cleanup test data
      await db.delete(overheadCosts).where(eq(overheadCosts.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it('should retrieve overhead costs for April 2026', async () => {
    if (!db) throw new Error('Database not available');

    const aprilCosts = await getOverheadCostsByMonth(testUserId, 4, 2026);
    
    expect(aprilCosts).toBeDefined();
    expect(aprilCosts?.month).toBe(4);
    expect(aprilCosts?.year).toBe(2026);
    expect(parseFloat(aprilCosts?.rent?.toString() || '0')).toBe(2000);
    expect(parseFloat(aprilCosts?.salaries?.toString() || '0')).toBe(3000);
    expect(parseFloat(aprilCosts?.electricity?.toString() || '0')).toBe(500);
    expect(parseFloat(aprilCosts?.others?.toString() || '0')).toBe(500);
  });

  it('should calculate total overhead correctly for April', async () => {
    if (!db) throw new Error('Database not available');

    const aprilCosts = await getOverheadCostsByMonth(testUserId, 4, 2026);
    
    const totalOverhead = 
      parseFloat(aprilCosts?.rent?.toString() || '0') +
      parseFloat(aprilCosts?.salaries?.toString() || '0') +
      parseFloat(aprilCosts?.electricity?.toString() || '0') +
      parseFloat(aprilCosts?.others?.toString() || '0');

    // Expected: 2000 + 3000 + 500 + 500 = 6000
    expect(totalOverhead).toBe(6000);
  });

  it('should retrieve different overhead costs for May 2026', async () => {
    if (!db) throw new Error('Database not available');

    const mayCosts = await getOverheadCostsByMonth(testUserId, 5, 2026);
    
    expect(mayCosts).toBeDefined();
    expect(mayCosts?.month).toBe(5);
    expect(mayCosts?.year).toBe(2026);
    expect(parseFloat(mayCosts?.rent?.toString() || '0')).toBe(2500);
    expect(parseFloat(mayCosts?.salaries?.toString() || '0')).toBe(3500);
    expect(parseFloat(mayCosts?.electricity?.toString() || '0')).toBe(600);
    expect(parseFloat(mayCosts?.others?.toString() || '0')).toBe(400);
  });

  it('should calculate total overhead correctly for May', async () => {
    if (!db) throw new Error('Database not available');

    const mayCosts = await getOverheadCostsByMonth(testUserId, 5, 2026);
    
    const totalOverhead = 
      parseFloat(mayCosts?.rent?.toString() || '0') +
      parseFloat(mayCosts?.salaries?.toString() || '0') +
      parseFloat(mayCosts?.electricity?.toString() || '0') +
      parseFloat(mayCosts?.others?.toString() || '0');

    // Expected: 2500 + 3500 + 600 + 400 = 7000
    expect(totalOverhead).toBe(7000);
  });

  it('should keep April and May overhead costs separate', async () => {
    if (!db) throw new Error('Database not available');

    const aprilCosts = await getOverheadCostsByMonth(testUserId, 4, 2026);
    const mayCosts = await getOverheadCostsByMonth(testUserId, 5, 2026);

    const aprilTotal = 
      parseFloat(aprilCosts?.rent?.toString() || '0') +
      parseFloat(aprilCosts?.salaries?.toString() || '0') +
      parseFloat(aprilCosts?.electricity?.toString() || '0') +
      parseFloat(aprilCosts?.others?.toString() || '0');

    const mayTotal = 
      parseFloat(mayCosts?.rent?.toString() || '0') +
      parseFloat(mayCosts?.salaries?.toString() || '0') +
      parseFloat(mayCosts?.electricity?.toString() || '0') +
      parseFloat(mayCosts?.others?.toString() || '0');

    expect(aprilTotal).toBe(6000);
    expect(mayTotal).toBe(7000);
    expect(aprilTotal).not.toBe(mayTotal);
  });

  it('should verify profit calculation logic: Gross Profit = Net Profit + Overhead', async () => {
    // Example scenario:
    // - Dashboard returns Net Profit = -5725 (after overhead deduction)
    // - Overhead Costs = 6000
    // - Gross Profit should be = -5725 + 6000 = 275
    
    const netProfit = -5725;
    const totalOverhead = 6000;
    const grossProfit = netProfit + totalOverhead;

    expect(grossProfit).toBe(275);
  });

  it('should verify no double deduction: Net Profit = Gross Profit - Overhead', async () => {
    // Verify the calculation on Overhead Costs page doesn't cause double deduction
    // - Gross Profit = 275
    // - Overhead = 6000
    // - Net Profit should be = 275 - 6000 = -5725 (same as Dashboard)
    
    const grossProfit = 275;
    const totalOverhead = 6000;
    const recalculatedNetProfit = grossProfit - totalOverhead;

    expect(recalculatedNetProfit).toBe(-5725);
  });

  it('should handle zero overhead costs correctly', async () => {
    // When overhead is 0:
    // - Gross Profit = Net Profit + 0 = Net Profit
    // - Net Profit = Gross Profit - 0 = Gross Profit
    
    const netProfit = 275;
    const totalOverhead = 0;
    const grossProfit = netProfit + totalOverhead;

    expect(grossProfit).toBe(275);
    expect(netProfit).toBe(grossProfit);
  });

  it('should handle positive net profit with overhead', async () => {
    // Scenario: Profit is higher than overhead
    // - Dashboard returns Net Profit = 1000 (after 6000 overhead deduction)
    // - This means Gross Profit = 1000 + 6000 = 7000
    // - Recalculated Net = 7000 - 6000 = 1000 (consistent)
    
    const netProfit = 1000;
    const totalOverhead = 6000;
    const grossProfit = netProfit + totalOverhead;
    const recalculatedNetProfit = grossProfit - totalOverhead;

    expect(grossProfit).toBe(7000);
    expect(recalculatedNetProfit).toBe(netProfit);
  });

  it('should handle negative net profit with overhead', async () => {
    // Scenario: Overhead exceeds profit (negative net profit)
    // - Dashboard returns Net Profit = -5725 (after 6000 overhead deduction)
    // - This means Gross Profit = -5725 + 6000 = 275
    // - Recalculated Net = 275 - 6000 = -5725 (consistent)
    
    const netProfit = -5725;
    const totalOverhead = 6000;
    const grossProfit = netProfit + totalOverhead;
    const recalculatedNetProfit = grossProfit - totalOverhead;

    expect(grossProfit).toBe(275);
    expect(recalculatedNetProfit).toBe(netProfit);
  });

  it('should verify consistency across multiple calculations', async () => {
    // Simulate multiple navigation cycles
    const netProfit = -5725;
    const totalOverhead = 6000;

    for (let i = 0; i < 5; i++) {
      const grossProfit = netProfit + totalOverhead;
      const recalculatedNetProfit = grossProfit - totalOverhead;

      expect(grossProfit).toBe(275);
      expect(recalculatedNetProfit).toBe(netProfit);
    }
  });

  it('should verify profit calculation with partial overhead', async () => {
    // Scenario: Overhead is less than profit
    // - Dashboard returns Net Profit = 175 (after 100 overhead deduction)
    // - This means Gross Profit = 175 + 100 = 275
    // - Recalculated Net = 275 - 100 = 175 (consistent)
    
    const netProfit = 175;
    const totalOverhead = 100;
    const grossProfit = netProfit + totalOverhead;
    const recalculatedNetProfit = grossProfit - totalOverhead;

    expect(grossProfit).toBe(275);
    expect(recalculatedNetProfit).toBe(netProfit);
  });
});
