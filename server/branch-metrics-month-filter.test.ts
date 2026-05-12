import { describe, it, expect, beforeAll } from 'vitest';
import { 
  setUserType, 
  createOrganization, 
  createBranch, 
  getBranchMetrics
} from './db-branches';
import { 
  upsertInventoryItem, 
  insertSalesTransaction 
} from './db';

// Test data
const TEST_USER_ID = 88888;
const TEST_ORG_NAME = 'Month Filter Test Pharmacy';
const TEST_BRANCH_NAME = 'Test Branch';

describe('Branch Metrics Month Filtering', () => {
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

  it('should only include inventory from the selected month', async () => {
    // Create inventory for May 2026
    const mayDate = new Date(2026, 4, 15); // May 15, 2026
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Paracetamol May',
      sku: 'PARA-MAY-2026',
      quantity: 100,
      price: 5.00,
      costPrice: 2.00,
      expiryDate: new Date(2026, 6, 15), // July 15, 2026
      createdAt: mayDate,
    });

    // Create inventory for June 2026
    const juneDate = new Date(2026, 5, 15); // June 15, 2026
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Aspirin June',
      sku: 'ASP-JUNE-2026',
      quantity: 50,
      price: 3.00,
      costPrice: 1.00,
      expiryDate: new Date(2026, 7, 15), // August 15, 2026
      createdAt: juneDate,
    });

    // Create sales transaction for June
    await insertSalesTransaction({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      inventoryId: 0,
      productName: 'Aspirin June',
      quantitySold: 20,
      salePrice: 3.00,
      totalSaleValue: 60.00,
      costPrice: 1.00,
      profit: 40.00,
      saleDate: juneDate,
      createdAt: juneDate,
    });

    // Query June metrics
    const juneMetrics = await getBranchMetrics(testBranchId, '2026-06');
    
    // Verify June metrics only include June inventory
    expect(juneMetrics).not.toBeNull();
    expect(juneMetrics?.totalRevenue).toBe(60.00); // Only June sales
    expect(juneMetrics?.estimatedProfit).toBe(40.00); // Only June profit
    expect(juneMetrics?.deadStockCount).toBe(0); // Aspirin June has sales, so not dead stock
    
    // Query May metrics
    const mayMetrics = await getBranchMetrics(testBranchId, '2026-05');
    
    // Verify May metrics only include May inventory
    expect(mayMetrics).not.toBeNull();
    expect(mayMetrics?.totalRevenue).toBe(0); // No May sales
    expect(mayMetrics?.deadStockCount).toBe(1); // Paracetamol May has no sales, so dead stock
    expect(mayMetrics?.deadStockValue).toBe(200.00); // 100 units * 2.00 costPrice
  });

  it('should not include May inventory when querying June metrics', async () => {
    // This test verifies the fix: inventory should be filtered by month
    const mayDate = new Date(2026, 4, 10);
    const juneDate = new Date(2026, 5, 10);

    // Create a new branch for this specific test
    const testBranch = await createBranch(testOrgId, 'Month Filter Test', 'Test Location');
    if (!testBranch?.id) throw new Error('Failed to create test branch');

    // Add May inventory
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranch.id,
      productName: 'Product A',
      sku: 'PROD-A-MAY',
      quantity: 100,
      price: 10.00,
      costPrice: 5.00,
      expiryDate: new Date(2026, 8, 10),
      createdAt: mayDate,
    });

    // Add June inventory
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranch.id,
      productName: 'Product B',
      sku: 'PROD-B-JUNE',
      quantity: 50,
      price: 8.00,
      costPrice: 3.00,
      expiryDate: new Date(2026, 8, 10),
      createdAt: juneDate,
    });

    // Query June metrics
    const juneMetrics = await getBranchMetrics(testBranch.id, '2026-06');
    
    // Should only count Product B (June inventory)
    expect(juneMetrics?.deadStockCount).toBe(1); // Only Product B
    expect(juneMetrics?.deadStockValue).toBe(150.00); // 50 * 3.00 costPrice

    // Query May metrics
    const mayMetrics = await getBranchMetrics(testBranch.id, '2026-05');
    
    // Should only count Product A (May inventory)
    expect(mayMetrics?.deadStockCount).toBe(1); // Only Product A
    expect(mayMetrics?.deadStockValue).toBe(500.00); // 100 * 5.00 costPrice
  });
});
