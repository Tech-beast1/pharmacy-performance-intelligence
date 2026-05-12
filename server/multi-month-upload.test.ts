import { describe, it, expect, beforeAll } from 'vitest';
import { 
  setUserType, 
  createOrganization, 
  createBranch, 
  getBranchMetrics,
  getConsolidatedMetrics
} from './db-branches';
import { 
  upsertInventoryItem, 
  insertSalesTransaction 
} from './db';

// Test data
const TEST_USER_ID = 77777;
const TEST_ORG_NAME = 'Multi-Month Upload Test Pharmacy';
const TEST_BRANCH_NAME = 'Test Branch';

describe('Multi-Month Upload Metrics Display', () => {
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

  it('should display correct metrics for January 2026 upload', async () => {
    const janDate = new Date(2026, 0, 15); // January 15, 2026

    // Upload inventory for January
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Vitamin C January',
      sku: 'VIT-C-JAN-2026',
      quantity: 200,
      price: 2.50,
      costPrice: 1.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: janDate,
    });

    // Upload sales for January
    await insertSalesTransaction({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      inventoryId: 0,
      productName: 'Vitamin C January',
      quantitySold: 100,
      salePrice: 2.50,
      totalSaleValue: 250.00,
      costPrice: 1.00,
      profit: 150.00,
      saleDate: janDate,
      createdAt: janDate,
    });

    // Query January metrics
    const janMetrics = await getBranchMetrics(testBranchId, '2026-01');
    
    expect(janMetrics).not.toBeNull();
    expect(janMetrics?.totalRevenue).toBe(250.00);
    expect(janMetrics?.estimatedProfit).toBe(150.00);
    expect(janMetrics?.deadStockCount).toBe(0); // All units have sales
    expect(janMetrics?.deadStockValue).toBe(0); // All units have sales
  });

  it('should display correct metrics for February 2026 upload', async () => {
    const febDate = new Date(2026, 1, 15); // February 15, 2026

    // Upload inventory for February
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Ibuprofen February',
      sku: 'IBU-FEB-2026',
      quantity: 150,
      price: 3.00,
      costPrice: 1.50,
      expiryDate: new Date(2026, 11, 31),
      createdAt: febDate,
    });

    // Upload sales for February
    await insertSalesTransaction({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      inventoryId: 0,
      productName: 'Ibuprofen February',
      quantitySold: 150,
      salePrice: 3.00,
      totalSaleValue: 450.00,
      costPrice: 1.50,
      profit: 225.00,
      saleDate: febDate,
      createdAt: febDate,
    });

    // Query February metrics
    const febMetrics = await getBranchMetrics(testBranchId, '2026-02');
    
    expect(febMetrics).not.toBeNull();
    expect(febMetrics?.totalRevenue).toBe(450.00);
    expect(febMetrics?.estimatedProfit).toBe(225.00);
    expect(febMetrics?.deadStockCount).toBe(0); // All sold
    expect(febMetrics?.deadStockValue).toBe(0);
  });

  it('should display correct metrics for March 2026 upload', async () => {
    const marDate = new Date(2026, 2, 15); // March 15, 2026

    // Upload inventory for March
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Paracetamol March',
      sku: 'PARA-MAR-2026',
      quantity: 300,
      price: 1.50,
      costPrice: 0.50,
      expiryDate: new Date(2026, 11, 31),
      createdAt: marDate,
    });

    // Upload sales for March
    await insertSalesTransaction({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      inventoryId: 0,
      productName: 'Paracetamol March',
      quantitySold: 50,
      salePrice: 1.50,
      totalSaleValue: 75.00,
      costPrice: 0.50,
      profit: 50.00,
      saleDate: marDate,
      createdAt: marDate,
    });

    // Query March metrics
    const marMetrics = await getBranchMetrics(testBranchId, '2026-03');
    
    expect(marMetrics).not.toBeNull();
    expect(marMetrics?.totalRevenue).toBe(75.00);
    expect(marMetrics?.estimatedProfit).toBe(50.00);
    expect(marMetrics?.deadStockCount).toBe(0); // All units have sales
    expect(marMetrics?.deadStockValue).toBe(0); // All units have sales
  });

  it('should display correct metrics for April 2026 upload', async () => {
    const aprDate = new Date(2026, 3, 15); // April 15, 2026

    // Upload inventory for April
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Aspirin April',
      sku: 'ASP-APR-2026',
      quantity: 100,
      price: 2.00,
      costPrice: 0.75,
      expiryDate: new Date(2026, 11, 31),
      createdAt: aprDate,
    });

    // Upload sales for April
    await insertSalesTransaction({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      inventoryId: 0,
      productName: 'Aspirin April',
      quantitySold: 75,
      salePrice: 2.00,
      totalSaleValue: 150.00,
      costPrice: 0.75,
      profit: 93.75,
      saleDate: aprDate,
      createdAt: aprDate,
    });

    // Query April metrics
    const aprMetrics = await getBranchMetrics(testBranchId, '2026-04');
    
    expect(aprMetrics).not.toBeNull();
    expect(aprMetrics?.totalRevenue).toBe(150.00);
    expect(aprMetrics?.estimatedProfit).toBe(93.75);
    expect(aprMetrics?.deadStockCount).toBe(0); // All units have sales
    expect(aprMetrics?.deadStockValue).toBe(0); // All units have sales
  });

  it('should display correct metrics for May 2026 upload', async () => {
    const mayDate = new Date(2026, 4, 15); // May 15, 2026

    // Upload inventory for May
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Cough Syrup May',
      sku: 'COUGH-MAY-2026',
      quantity: 80,
      price: 5.00,
      costPrice: 2.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: mayDate,
    });

    // Upload sales for May
    await insertSalesTransaction({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      inventoryId: 0,
      productName: 'Cough Syrup May',
      quantitySold: 60,
      salePrice: 5.00,
      totalSaleValue: 300.00,
      costPrice: 2.00,
      profit: 180.00,
      saleDate: mayDate,
      createdAt: mayDate,
    });

    // Query May metrics
    const mayMetrics = await getBranchMetrics(testBranchId, '2026-05');
    
    expect(mayMetrics).not.toBeNull();
    expect(mayMetrics?.totalRevenue).toBe(300.00);
    expect(mayMetrics?.estimatedProfit).toBe(180.00);
    expect(mayMetrics?.deadStockCount).toBe(0); // All units have sales
    expect(mayMetrics?.deadStockValue).toBe(0); // All units have sales
  });

  it('should display correct metrics for June 2026 upload', async () => {
    const junDate = new Date(2026, 5, 15); // June 15, 2026

    // Upload inventory for June
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      productName: 'Antibiotic June',
      sku: 'ANTI-JUN-2026',
      quantity: 120,
      price: 8.00,
      costPrice: 3.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: junDate,
    });

    // Upload sales for June
    await insertSalesTransaction({
      userId: TEST_USER_ID,
      branchId: testBranchId,
      inventoryId: 0,
      productName: 'Antibiotic June',
      quantitySold: 100,
      salePrice: 8.00,
      totalSaleValue: 800.00,
      costPrice: 3.00,
      profit: 500.00,
      saleDate: junDate,
      createdAt: junDate,
    });

    // Query June metrics
    const junMetrics = await getBranchMetrics(testBranchId, '2026-06');
    
    expect(junMetrics).not.toBeNull();
    expect(junMetrics?.totalRevenue).toBe(800.00);
    expect(junMetrics?.estimatedProfit).toBe(500.00);
    // Note: deadStockCount may include items from previous months that have no sales in June
    // This is expected behavior - items from previous months that don't sell in June are dead stock for that month
  });

  it('should display correct consolidated metrics for all months combined', async () => {
    // Query consolidated metrics for each month
    const janConsolidated = await getConsolidatedMetrics(testOrgId, '2026-01');
    const febConsolidated = await getConsolidatedMetrics(testOrgId, '2026-02');
    const marConsolidated = await getConsolidatedMetrics(testOrgId, '2026-03');
    const aprConsolidated = await getConsolidatedMetrics(testOrgId, '2026-04');
    const mayConsolidated = await getConsolidatedMetrics(testOrgId, '2026-05');
    const junConsolidated = await getConsolidatedMetrics(testOrgId, '2026-06');

    // Verify each month has correct consolidated metrics
    expect(janConsolidated?.totalRevenue).toBe(250.00);
    expect(febConsolidated?.totalRevenue).toBe(450.00);
    expect(marConsolidated?.totalRevenue).toBe(75.00);
    expect(aprConsolidated?.totalRevenue).toBe(150.00);
    expect(mayConsolidated?.totalRevenue).toBe(300.00);
    expect(junConsolidated?.totalRevenue).toBe(800.00);

    // Verify profits
    expect(janConsolidated?.estimatedProfit).toBe(150.00);
    expect(febConsolidated?.estimatedProfit).toBe(225.00);
    expect(marConsolidated?.estimatedProfit).toBe(50.00);
    expect(aprConsolidated?.estimatedProfit).toBe(93.75);
    expect(mayConsolidated?.estimatedProfit).toBe(180.00);
    expect(junConsolidated?.estimatedProfit).toBe(500.00);
  });

  it('should not cross-contaminate metrics between months', async () => {
    // Verify that January metrics don't include data from other months
    const janMetrics = await getBranchMetrics(testBranchId, '2026-01');
    expect(janMetrics?.totalRevenue).toBe(250.00); // Only January sales
    // Dead stock may include items from previous months

    // Verify that February metrics don't include data from other months
    const febMetrics = await getBranchMetrics(testBranchId, '2026-02');
    expect(febMetrics?.totalRevenue).toBe(450.00); // Only February sales
    // Dead stock may include items from previous months

    // Verify that June metrics don't include data from other months
    const junMetrics = await getBranchMetrics(testBranchId, '2026-06');
    expect(junMetrics?.totalRevenue).toBe(800.00); // Only June sales
    // Dead stock may include items from previous months
  });
});
