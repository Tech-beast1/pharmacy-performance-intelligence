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

/**
 * END-TO-END TEST: Simulates the exact user workflow
 * 
 * User's Workflow:
 * 1. Upload May sales data for Tema and Kasoa branches
 * 2. Upload May inventory data for Tema and Kasoa branches
 * 3. Verify May metrics show correctly
 * 4. Switch to June month
 * 5. Upload June sales data for Tema and Kasoa branches
 * 6. Verify June sales metrics show correctly
 * 7. Upload June inventory data for Tema and Kasoa branches
 * 8. Verify June inventory metrics show correctly
 * 9. Verify May metrics are UNCHANGED (not affected by June upload)
 * 10. Verify each branch's data is independent
 */

const TEST_USER_ID = 222222;
const TEST_ORG_NAME = 'E2E Test Organization';
const TEMA_BRANCH = 'Tema';
const KASOA_BRANCH = 'Kasoa';

describe('E2E Test: Complete Inventory Upload Workflow', () => {
  let testOrgId: number;
  let temaBranchId: number;
  let kasoaBranchId: number;

  beforeAll(async () => {
    // Setup: Create organization and branches
    await setUserType(TEST_USER_ID, 'organization_owner');
    const org = await createOrganization(TEST_USER_ID, TEST_ORG_NAME);
    if (!org?.id) throw new Error('Failed to create test organization');
    testOrgId = org.id;

    const temaBranch = await createBranch(testOrgId, TEMA_BRANCH, 'Tema Location');
    if (!temaBranch?.id) throw new Error('Failed to create Tema branch');
    temaBranchId = temaBranch.id;

    const kasoaBranch = await createBranch(testOrgId, KASOA_BRANCH, 'Kasoa Location');
    if (!kasoaBranch?.id) throw new Error('Failed to create Kasoa branch');
    kasoaBranchId = kasoaBranch.id;
  });

  it('Step 1-2: Upload May sales and inventory for both branches', async () => {
    const mayDate = new Date(2026, 4, 15); // May 15, 2026

    // Upload May SALES for Tema
    await insertSalesTransaction({
      userId: TEST_USER_ID,
      branchId: temaBranchId,
      inventoryId: 0,
      productName: 'Paracetamol Tema May',
      quantitySold: 50,
      salePrice: 5.00,
      totalSaleValue: 250.00,
      costPrice: 2.00,
      profit: 150.00,
      saleDate: mayDate,
      createdAt: mayDate,
    });

    // Upload May SALES for Kasoa
    await insertSalesTransaction({
      userId: TEST_USER_ID,
      branchId: kasoaBranchId,
      inventoryId: 0,
      productName: 'Paracetamol Kasoa May',
      quantitySold: 40,
      salePrice: 5.00,
      totalSaleValue: 200.00,
      costPrice: 2.00,
      profit: 120.00,
      saleDate: mayDate,
      createdAt: mayDate,
    });

    // Upload May INVENTORY for Tema (dead stock - no sales)
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: temaBranchId,
      productName: 'Ibuprofen Tema May',
      sku: 'IBU-TEMA-2026-05',
      quantity: 100,
      price: 10.00,
      costPrice: 5.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: mayDate,
    });

    // Upload May INVENTORY for Kasoa (dead stock - no sales)
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: kasoaBranchId,
      productName: 'Ibuprofen Kasoa May',
      sku: 'IBU-KASOA-2026-05',
      quantity: 80,
      price: 8.00,
      costPrice: 4.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: mayDate,
    });

    // Verify May metrics for Tema
    const temaMayMetrics = await getBranchMetrics(temaBranchId, '2026-05');
    expect(temaMayMetrics?.totalRevenue).toBe(250.00);
    expect(temaMayMetrics?.deadStockCount).toBe(1);
    expect(temaMayMetrics?.deadStockValue).toBe(500.00); // 100 * 5.00

    // Verify May metrics for Kasoa
    const kasoaMayMetrics = await getBranchMetrics(kasoaBranchId, '2026-05');
    expect(kasoaMayMetrics?.totalRevenue).toBe(200.00);
    expect(kasoaMayMetrics?.deadStockCount).toBe(1);
    expect(kasoaMayMetrics?.deadStockValue).toBe(320.00); // 80 * 4.00

    // Verify consolidated May metrics
    const consolidatedMay = await getConsolidatedMetrics(testOrgId, '2026-05');
    expect(consolidatedMay?.totalRevenue).toBe(450.00); // 250 + 200
    expect(consolidatedMay?.deadStockCount).toBe(2);
    expect(consolidatedMay?.deadStockValue).toBe(820.00); // 500 + 320
  });

  it('Step 3: Verify May metrics are correct before June upload', async () => {
    // Store May metrics BEFORE June upload
    const temaMayBefore = await getBranchMetrics(temaBranchId, '2026-05');
    const kasoaMayBefore = await getBranchMetrics(kasoaBranchId, '2026-05');
    const consolidatedMayBefore = await getConsolidatedMetrics(testOrgId, '2026-05');

    expect(temaMayBefore?.totalRevenue).toBe(250.00);
    expect(temaMayBefore?.deadStockValue).toBe(500.00);
    expect(kasoaMayBefore?.totalRevenue).toBe(200.00);
    expect(kasoaMayBefore?.deadStockValue).toBe(320.00);
    expect(consolidatedMayBefore?.totalRevenue).toBe(450.00);
    expect(consolidatedMayBefore?.deadStockValue).toBe(820.00);
  });

  it('Step 4-6: Upload June sales data and verify metrics', async () => {
    const juneDate = new Date(2026, 5, 15); // June 15, 2026

    // Upload June SALES for Tema
    await insertSalesTransaction({
      userId: TEST_USER_ID,
      branchId: temaBranchId,
      inventoryId: 0,
      productName: 'Paracetamol Tema June',
      quantitySold: 60,
      salePrice: 5.50,
      totalSaleValue: 330.00,
      costPrice: 2.00,
      profit: 210.00,
      saleDate: juneDate,
      createdAt: juneDate,
    });

    // Upload June SALES for Kasoa
    await insertSalesTransaction({
      userId: TEST_USER_ID,
      branchId: kasoaBranchId,
      inventoryId: 0,
      productName: 'Paracetamol Kasoa June',
      quantitySold: 50,
      salePrice: 5.50,
      totalSaleValue: 275.00,
      costPrice: 2.00,
      profit: 175.00,
      saleDate: juneDate,
      createdAt: juneDate,
    });

    // Verify June sales metrics for Tema
    const temaJuneMetrics = await getBranchMetrics(temaBranchId, '2026-06');
    expect(temaJuneMetrics?.totalRevenue).toBe(330.00);

    // Verify June sales metrics for Kasoa
    const kasaoJuneMetrics = await getBranchMetrics(kasoaBranchId, '2026-06');
    expect(kasaoJuneMetrics?.totalRevenue).toBe(275.00);

    // Verify consolidated June metrics
    const consolidatedJune = await getConsolidatedMetrics(testOrgId, '2026-06');
    expect(consolidatedJune?.totalRevenue).toBe(605.00); // 330 + 275
  });

  it('Step 7-9: Upload June inventory and verify it does NOT affect May', async () => {
    const juneDate = new Date(2026, 5, 15); // June 15, 2026

    // Store May metrics BEFORE June inventory upload
    const temaMayBeforeInventory = await getBranchMetrics(temaBranchId, '2026-05');
    const kasoaMayBeforeInventory = await getBranchMetrics(kasoaBranchId, '2026-05');
    const consolidatedMayBeforeInventory = await getConsolidatedMetrics(testOrgId, '2026-05');

    // Upload June INVENTORY for Tema (dead stock - no sales)
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: temaBranchId,
      productName: 'Ibuprofen Tema June',
      sku: 'IBU-TEMA-2026-06',
      quantity: 150,
      price: 12.00,
      costPrice: 6.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: juneDate,
    });

    // Upload June INVENTORY for Kasoa (dead stock - no sales)
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: kasoaBranchId,
      productName: 'Ibuprofen Kasoa June',
      sku: 'IBU-KASOA-2026-06',
      quantity: 120,
      price: 10.00,
      costPrice: 5.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: juneDate,
    });

    // *** CRITICAL TEST: Verify May metrics are UNCHANGED after June inventory upload ***
    const temaMayAfterInventory = await getBranchMetrics(temaBranchId, '2026-05');
    expect(temaMayAfterInventory?.deadStockValue).toBe(temaMayBeforeInventory?.deadStockValue);
    expect(temaMayAfterInventory?.deadStockCount).toBe(temaMayBeforeInventory?.deadStockCount);
    expect(temaMayAfterInventory?.totalRevenue).toBe(temaMayBeforeInventory?.totalRevenue);

    const kasoaMayAfterInventory = await getBranchMetrics(kasoaBranchId, '2026-05');
    expect(kasoaMayAfterInventory?.deadStockValue).toBe(kasoaMayBeforeInventory?.deadStockValue);
    expect(kasoaMayAfterInventory?.deadStockCount).toBe(kasoaMayBeforeInventory?.deadStockCount);
    expect(kasoaMayAfterInventory?.totalRevenue).toBe(kasoaMayBeforeInventory?.totalRevenue);

    const consolidatedMayAfterInventory = await getConsolidatedMetrics(testOrgId, '2026-05');
    expect(consolidatedMayAfterInventory?.deadStockValue).toBe(consolidatedMayBeforeInventory?.deadStockValue);
    expect(consolidatedMayAfterInventory?.deadStockCount).toBe(consolidatedMayBeforeInventory?.deadStockCount);
    expect(consolidatedMayAfterInventory?.totalRevenue).toBe(consolidatedMayBeforeInventory?.totalRevenue);

    // Verify June inventory metrics show correctly
    const temaJuneMetricsWithInventory = await getBranchMetrics(temaBranchId, '2026-06');
    expect(temaJuneMetricsWithInventory?.deadStockCount).toBe(1);
    expect(temaJuneMetricsWithInventory?.deadStockValue).toBe(900.00); // 150 * 6.00

    const kasaoJuneMetricsWithInventory = await getBranchMetrics(kasoaBranchId, '2026-06');
    expect(kasaoJuneMetricsWithInventory?.deadStockCount).toBe(1);
    expect(kasaoJuneMetricsWithInventory?.deadStockValue).toBe(600.00); // 120 * 5.00

    const consolidatedJuneWithInventory = await getConsolidatedMetrics(testOrgId, '2026-06');
    expect(consolidatedJuneWithInventory?.deadStockCount).toBe(2);
    expect(consolidatedJuneWithInventory?.deadStockValue).toBe(1500.00); // 900 + 600
  });

  it('Step 10: Verify complete independence - May and June are separate', async () => {
    // Get final metrics for all months and branches
    const temaMay = await getBranchMetrics(temaBranchId, '2026-05');
    const temaJune = await getBranchMetrics(temaBranchId, '2026-06');
    const kasoaMay = await getBranchMetrics(kasoaBranchId, '2026-05');
    const kasaoJune = await getBranchMetrics(kasoaBranchId, '2026-06');

    // Verify Tema May
    expect(temaMay?.totalRevenue).toBe(250.00);
    expect(temaMay?.deadStockValue).toBe(500.00);

    // Verify Tema June
    expect(temaJune?.totalRevenue).toBe(330.00);
    expect(temaJune?.deadStockValue).toBe(900.00);

    // Verify Kasoa May
    expect(kasoaMay?.totalRevenue).toBe(200.00);
    expect(kasoaMay?.deadStockValue).toBe(320.00);

    // Verify Kasoa June
    expect(kasaoJune?.totalRevenue).toBe(275.00);
    expect(kasaoJune?.deadStockValue).toBe(600.00);

    // Verify consolidated metrics
    const consolidatedMay = await getConsolidatedMetrics(testOrgId, '2026-05');
    const consolidatedJune = await getConsolidatedMetrics(testOrgId, '2026-06');

    expect(consolidatedMay?.totalRevenue).toBe(450.00); // 250 + 200
    expect(consolidatedMay?.deadStockValue).toBe(820.00); // 500 + 320

    expect(consolidatedJune?.totalRevenue).toBe(605.00); // 330 + 275
    expect(consolidatedJune?.deadStockValue).toBe(1500.00); // 900 + 600

    // Verify they are completely independent
    expect(consolidatedMay?.totalRevenue).not.toBe(consolidatedJune?.totalRevenue);
    expect(consolidatedMay?.deadStockValue).not.toBe(consolidatedJune?.deadStockValue);
  });
});
