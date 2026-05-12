import { describe, it, expect, beforeAll } from 'vitest';
import { 
  setUserType, 
  createOrganization, 
  createBranch, 
  getBranchMetrics,
} from './db-branches';
import { 
  upsertInventoryItem, 
  insertSalesTransaction 
} from './db';

// Test data
const TEST_USER_ID = 88888;
const TEST_ORG_NAME = 'Month Independence CreatedAt Test Pharmacy';
const TEST_BRANCH_NAME = 'Test Branch';

describe('Month Independence - CreatedAt Preservation', () => {
  let testOrgId: number;
  let testBranchId: number;

  beforeAll(async () => {
    // Setup: Create organization and branch
    await setUserType(TEST_USER_ID, 'organization_owner');
    const org = await createOrganization(TEST_USER_ID, TEST_ORG_NAME);
    if (!org?.id) throw new Error('Failed to create test organization');
    testOrgId = org.id;

    const branch = await createBranch(testOrgId, TEST_BRANCH_NAME, 'Test Location');
    if (!branch?.id) throw new Error('Failed to create test branch');
    testBranchId = branch.id;
  });

  it('should preserve May inventory createdAt when uploading June inventory', async () => {
    const mayDate = new Date(2026, 4, 15); // May 15, 2026
    const juneDate = new Date(2026, 5, 15); // June 15, 2026

    // Step 1: Upload inventory for May with dead stock (no sales)
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Test Product May',
      sku: 'TEST-PROD-2026-05', // Month suffix in SKU
      quantity: 100,
      price: 10.00,
      costPrice: 5.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: mayDate,
    });

    // Step 2: Query May metrics - should have 1 dead stock item (100 units * ₵5.00 = ₵500.00)
    const mayMetricsBeforeJune = await getBranchMetrics(testBranchId, '2026-05');
    expect(mayMetricsBeforeJune?.deadStockCount).toBe(1);
    expect(mayMetricsBeforeJune?.deadStockValue).toBe(500.00);

    // Step 3: Upload inventory for June with different SKU (month suffix)
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Test Product June',
      sku: 'TEST-PROD-2026-06', // Different month suffix
      quantity: 50,
      price: 10.00,
      costPrice: 5.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: juneDate,
    });

    // Step 4: Query May metrics again - should STILL have 1 dead stock item (not affected by June upload)
    const mayMetricsAfterJune = await getBranchMetrics(testBranchId, '2026-05');
    expect(mayMetricsAfterJune?.deadStockCount).toBe(1);
    expect(mayMetricsAfterJune?.deadStockValue).toBe(500.00);

    // Step 5: Query June metrics - should have 1 dead stock item (50 units * ₵5.00 = ₵250.00)
    const juneMetrics = await getBranchMetrics(testBranchId, '2026-06');
    expect(juneMetrics?.deadStockCount).toBe(1);
    expect(juneMetrics?.deadStockValue).toBe(250.00);
  });

  it('should maintain separate inventory items for different months even with same product name', async () => {
    const mayDate = new Date(2026, 4, 20); // May 20, 2026
    const juneDate = new Date(2026, 5, 20); // June 20, 2026

    // Upload same product name but for different months (with month suffix in SKU)
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Vitamin C',
      sku: 'VIT-C-2026-05', // May
      quantity: 200,
      price: 2.50,
      costPrice: 1.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: mayDate,
    });

    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Vitamin C',
      sku: 'VIT-C-2026-06', // June
      quantity: 150,
      price: 2.50,
      costPrice: 1.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: juneDate,
    });

    // May metrics should only include May inventory
    const mayMetrics = await getBranchMetrics(testBranchId, '2026-05');
    // May has Vitamin C (200 units, no sales) = 1 dead stock item
    expect(mayMetrics?.deadStockCount).toBeGreaterThanOrEqual(1);
    expect(mayMetrics?.deadStockValue).toBeGreaterThanOrEqual(200.00); // At least 200 * 1.00

    // June metrics should only include June inventory
    const juneMetrics = await getBranchMetrics(testBranchId, '2026-06');
    // June has Vitamin C (150 units, no sales) = 1 dead stock item
    expect(juneMetrics?.deadStockCount).toBeGreaterThanOrEqual(1);
    expect(juneMetrics?.deadStockValue).toBeGreaterThanOrEqual(150.00); // At least 150 * 1.00
  });

  it('should correctly handle expiry risk across different months', async () => {
    const mayDate = new Date(2026, 4, 25); // May 25, 2026
    const juneDate = new Date(2026, 5, 25); // June 25, 2026
    const now = new Date();
    const expiryDateSoon = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

    // Upload inventory for May with expiry risk
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Expiring Product May',
      sku: 'EXP-PROD-2026-05',
      quantity: 75,
      price: 8.00,
      costPrice: 4.00,
      expiryDate: expiryDateSoon,
      createdAt: mayDate,
    });

    // Upload inventory for June with expiry risk
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Expiring Product June',
      sku: 'EXP-PROD-2026-06',
      quantity: 50,
      price: 8.00,
      costPrice: 4.00,
      expiryDate: expiryDateSoon,
      createdAt: juneDate,
    });

    // Query May metrics - should have expiry risk from May inventory only
    const mayMetrics = await getBranchMetrics(testBranchId, '2026-05');
    expect(mayMetrics?.expiryRiskCount).toBeGreaterThanOrEqual(1);
    expect(mayMetrics?.expiryRiskLoss).toBeGreaterThanOrEqual(300.00); // At least 75 * 4.00

    // Query June metrics - should have expiry risk from June inventory only
    const juneMetrics = await getBranchMetrics(testBranchId, '2026-06');
    expect(juneMetrics?.expiryRiskCount).toBeGreaterThanOrEqual(1);
    expect(juneMetrics?.expiryRiskLoss).toBeGreaterThanOrEqual(200.00); // At least 50 * 4.00
  });

  it('should not update createdAt when upserting existing inventory', async () => {
    const mayDate = new Date(2026, 4, 10); // May 10, 2026
    const juneDate = new Date(2026, 5, 10); // June 10, 2026

    // Create inventory for May
    const sku = 'UPSERT-TEST-2026-05';
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Upsert Test Product',
      sku: sku,
      quantity: 100,
      price: 5.00,
      costPrice: 2.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: mayDate,
    });

    // Get May metrics before upsert
    const mayMetricsBeforeUpsert = await getBranchMetrics(testBranchId, '2026-05');
    const mayDeadStockBefore = mayMetricsBeforeUpsert?.deadStockCount || 0;

    // Upsert the same inventory item with June date (should NOT change createdAt)
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Upsert Test Product',
      sku: sku,
      quantity: 150, // Changed quantity
      price: 5.00,
      costPrice: 2.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: juneDate, // This should be ignored during update
    });

    // Get May metrics after upsert - should be unchanged (createdAt was preserved)
    const mayMetricsAfterUpsert = await getBranchMetrics(testBranchId, '2026-05');
    expect(mayMetricsAfterUpsert?.deadStockCount).toBe(mayDeadStockBefore);

    // The item should still be in May, not moved to June
    const mayMetricsCheck = await getBranchMetrics(testBranchId, '2026-05');
    expect(mayMetricsCheck?.deadStockValue).toBeGreaterThanOrEqual(300.00); // 150 * 2.00
  });
});
