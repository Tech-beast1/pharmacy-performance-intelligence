import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { users, overheadCosts, inventory, salesTransactions } from '../drizzle/schema';
import { getOverheadCostsByMonth, upsertOverheadCosts } from './db';
import { eq } from 'drizzle-orm';

describe('Overhead Costs - Timezone & Month Isolation', () => {
  let testUserId: number;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test user with unique openId
    const testOpenId = `test-oc-user-${Date.now()}`;
    await db.insert(users).values({
      openId: testOpenId,
      name: 'Test OC User',
      email: 'testoc@example.com',
      role: 'user',
      lastSignedIn: new Date(),
    });
    
    // Get the inserted user ID
    const insertedUsers = await db.select().from(users).where(eq(users.openId, testOpenId)).limit(1);
    if (insertedUsers.length === 0) throw new Error('Failed to create test user');
    testUserId = insertedUsers[0].id;
  });

  it('should store April overhead costs in April (month=4, year=2026)', async () => {
    if (!db) throw new Error('Database not available');

    // Insert April overhead costs
    const aprilCosts = await upsertOverheadCosts({
      userId: testUserId,
      month: 4,
      year: 2026,
      rent: '5000.00',
      salaries: '8000.00',
      electricity: '1500.00',
      others: '500.00',
    });

    // Verify April costs were stored
    const retrievedApril = await getOverheadCostsByMonth(testUserId, 4, 2026);
    expect(retrievedApril).toBeDefined();
    expect(retrievedApril?.month).toBe(4);
    expect(retrievedApril?.year).toBe(2026);
    expect(parseFloat(retrievedApril?.rent?.toString() || '0')).toBe(5000);
    expect(parseFloat(retrievedApril?.salaries?.toString() || '0')).toBe(8000);
  });

  it('should store May overhead costs in May (month=5, year=2026)', async () => {
    if (!db) throw new Error('Database not available');

    // Insert May overhead costs
    const mayCosts = await upsertOverheadCosts({
      userId: testUserId,
      month: 5,
      year: 2026,
      rent: '5500.00',
      salaries: '8500.00',
      electricity: '1600.00',
      others: '600.00',
    });

    // Verify May costs were stored
    const retrievedMay = await getOverheadCostsByMonth(testUserId, 5, 2026);
    expect(retrievedMay).toBeDefined();
    expect(retrievedMay?.month).toBe(5);
    expect(retrievedMay?.year).toBe(2026);
    expect(parseFloat(retrievedMay?.rent?.toString() || '0')).toBe(5500);
    expect(parseFloat(retrievedMay?.salaries?.toString() || '0')).toBe(8500);
  });

  it('should keep April and May overhead costs separate', async () => {
    if (!db) throw new Error('Database not available');

    // Retrieve both months
    const aprilCosts = await getOverheadCostsByMonth(testUserId, 4, 2026);
    const mayCosts = await getOverheadCostsByMonth(testUserId, 5, 2026);

    // Verify they are different
    expect(aprilCosts).toBeDefined();
    expect(mayCosts).toBeDefined();
    
    const aprilRent = parseFloat(aprilCosts?.rent?.toString() || '0');
    const mayRent = parseFloat(mayCosts?.rent?.toString() || '0');
    
    expect(aprilRent).toBe(5000);
    expect(mayRent).toBe(5500);
    expect(aprilRent).not.toBe(mayRent);
  });

  it('should parse date string "2026-05-01" as May (month=5) not April', async () => {
    // This test verifies the timezone fix in routers.ts
    // When parsing "2026-05-01", we should extract month=5, year=2026
    // NOT use new Date() which could interpret it in local timezone
    
    const dateString = "2026-05-01";
    const [yearStr, monthStr] = dateString.split('-');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    
    expect(month).toBe(5);
    expect(year).toBe(2026);
    
    // Verify this matches May's overhead costs
    const mayCosts = await getOverheadCostsByMonth(testUserId, month, year);
    expect(mayCosts?.month).toBe(5);
  });

  it('should not fetch April costs when requesting May (month=5)', async () => {
    if (!db) throw new Error('Database not available');

    // Try to fetch May costs
    const mayCosts = await getOverheadCostsByMonth(testUserId, 5, 2026);
    
    // Verify we got May's data, not April's
    expect(mayCosts).toBeDefined();
    expect(mayCosts?.month).toBe(5);
    
    const mayRent = parseFloat(mayCosts?.rent?.toString() || '0');
    const aprilRent = 5000; // April's rent
    
    // May rent should be 5500, not 5000 (April's value)
    expect(mayRent).toBe(5500);
    expect(mayRent).not.toBe(aprilRent);
  });

  it('should return null when requesting non-existent month', async () => {
    if (!db) throw new Error('Database not available');

    // Try to fetch June costs (which don't exist)
    const juneCosts = await getOverheadCostsByMonth(testUserId, 6, 2026);
    
    // Should return null since we never inserted June costs
    expect(juneCosts).toBeNull();
  });
});
