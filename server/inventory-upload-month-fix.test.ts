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

/**
 * Test for the inventory upload month independence bug fix.
 * 
 * Bug Description:
 * When uploading inventory data for June, it would not show June inventory metrics
 * but instead would affect May's Dead Stock and Expiry Risk values.
 * 
 * Root Cause:
 * The SmartUpload component was not updating the effectiveUploadDate when the
 * uploadDate prop changed. This caused inventory to be created with the wrong
 * createdAt date.
 * 
 * Fix:
 * Added useEffect hook in SmartUpload to update effectiveUploadDate whenever
 * the uploadDate prop changes.
 */

const TEST_USER_ID = 111111;
const TEST_ORG_NAME = 'Inventory Upload Month Fix Test';
const TEST_BRANCH_NAME = 'Test Branch';

describe('Inventory Upload Month Independence Bug Fix', () => {
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

  it('should upload May inventory and show correct May metrics', async () => {
    const mayDate = new Date(2026, 4, 15); // May 15, 2026

    // Upload May inventory with dead stock (no sales)
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'May Product',
      sku: 'MAY-PROD-2026-05',
      quantity: 100,
      price: 10.00,
      costPrice: 5.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: mayDate,
    });

    // Query May metrics
    const mayMetrics = await getBranchMetrics(testBranchId, '2026-05');
    
    expect(mayMetrics).not.toBeNull();
    expect(mayMetrics?.deadStockCount).toBe(1);
    expect(mayMetrics?.deadStockValue).toBe(500.00); // 100 * 5.00
  });

  it('should upload June inventory and show correct June metrics (not May)', async () => {
    const mayDate = new Date(2026, 4, 15); // May 15, 2026
    const juneDate = new Date(2026, 5, 15); // June 15, 2026

    // Get May metrics BEFORE June upload
    const mayMetricsBeforeJuneUpload = await getBranchMetrics(testBranchId, '2026-05');
    const mayDeadStockBefore = mayMetricsBeforeJuneUpload?.deadStockValue || 0;

    // Upload June inventory with dead stock (no sales)
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'June Product',
      sku: 'JUNE-PROD-2026-06',
      quantity: 150,
      price: 12.00,
      costPrice: 6.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: juneDate,
    });

    // Query June metrics - should show June inventory
    const juneMetrics = await getBranchMetrics(testBranchId, '2026-06');
    
    expect(juneMetrics).not.toBeNull();
    expect(juneMetrics?.deadStockCount).toBe(1);
    expect(juneMetrics?.deadStockValue).toBe(900.00); // 150 * 6.00

    // Verify May metrics are UNCHANGED after June upload
    const mayMetricsAfterJuneUpload = await getBranchMetrics(testBranchId, '2026-05');
    expect(mayMetricsAfterJuneUpload?.deadStockValue).toBe(mayDeadStockBefore);
  });

  it('should correctly handle expiry risk for June inventory (not affect May)', async () => {
    const now = new Date();
    const expiryDateSoon = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
    const juneDate = new Date(2026, 5, 20); // June 20, 2026

    // Get May metrics BEFORE June expiry risk upload
    const mayMetricsBeforeJuneExpiry = await getBranchMetrics(testBranchId, '2026-05');
    const mayExpiryRiskBefore = mayMetricsBeforeJuneExpiry?.expiryRiskLoss || 0;

    // Upload June inventory with expiry risk
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'June Expiring Product',
      sku: 'JUNE-EXP-2026-06',
      quantity: 50,
      price: 8.00,
      costPrice: 4.00,
      expiryDate: expiryDateSoon,
      createdAt: juneDate,
    });

    // Query June metrics - should show June expiry risk
    const juneMetrics = await getBranchMetrics(testBranchId, '2026-06');
    expect(juneMetrics?.expiryRiskCount).toBeGreaterThanOrEqual(1);
    expect(juneMetrics?.expiryRiskLoss).toBeGreaterThanOrEqual(200.00); // At least 50 * 4.00

    // Verify May metrics are UNCHANGED after June expiry risk upload
    const mayMetricsAfterJuneExpiry = await getBranchMetrics(testBranchId, '2026-05');
    expect(mayMetricsAfterJuneExpiry?.expiryRiskLoss).toBe(mayExpiryRiskBefore);
  });

  it('should maintain complete independence: May and June have separate inventory', async () => {
    // Query final metrics for both months
    const mayMetrics = await getBranchMetrics(testBranchId, '2026-05');
    const juneMetrics = await getBranchMetrics(testBranchId, '2026-06');

    // May should have only May inventory
    expect(mayMetrics?.deadStockCount).toBe(1); // Only May Product
    expect(mayMetrics?.deadStockValue).toBe(500.00); // Only May Product value

    // June should have only June inventory
    expect(juneMetrics?.deadStockCount).toBeGreaterThanOrEqual(2); // June Product + June Expiring Product
    expect(juneMetrics?.deadStockValue).toBeGreaterThanOrEqual(900.00); // At least June Product value

    // Verify they are completely independent
    expect(mayMetrics?.deadStockValue).not.toBe(juneMetrics?.deadStockValue);
  });

  it('should correctly assign inventory to the month specified in createdAt', async () => {
    const aprilDate = new Date(2026, 3, 10); // April 10, 2026
    const julyDate = new Date(2026, 6, 10); // July 10, 2026

    // Upload April inventory
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'April Product',
      sku: 'APRIL-PROD-2026-04',
      quantity: 75,
      price: 7.00,
      costPrice: 3.50,
      expiryDate: new Date(2026, 11, 31),
      createdAt: aprilDate,
    });

    // Upload July inventory
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'July Product',
      sku: 'JULY-PROD-2026-07',
      quantity: 200,
      price: 15.00,
      costPrice: 8.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: julyDate,
    });

    // Query April metrics
    const aprilMetrics = await getBranchMetrics(testBranchId, '2026-04');
    expect(aprilMetrics?.deadStockCount).toBeGreaterThanOrEqual(1);
    expect(aprilMetrics?.deadStockValue).toBeGreaterThanOrEqual(262.50); // At least April Product value

    // Query July metrics
    const julyMetrics = await getBranchMetrics(testBranchId, '2026-07');
    expect(julyMetrics?.deadStockCount).toBeGreaterThanOrEqual(1);
    expect(julyMetrics?.deadStockValue).toBeGreaterThanOrEqual(1600.00); // At least July Product value

    // Verify April and July are independent
    expect(aprilMetrics?.deadStockValue).not.toBe(julyMetrics?.deadStockValue);
  });
});
