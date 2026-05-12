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
 * Integration test that simulates the exact scenario from the bug report:
 * 1. Upload data for May (Tema and Kasoa branches)
 * 2. Verify May metrics are correct
 * 3. Upload data for June (Tema and Kasoa branches)
 * 4. Verify May metrics are UNCHANGED (not affected by June upload)
 * 5. Verify June metrics are correct
 */

const TEST_USER_ID = 99999;
const TEST_ORG_NAME = 'Month Independence Integration Test';
const TEMA_BRANCH = 'Tema Branch';
const KASOA_BRANCH = 'Kasoa Branch';

describe('Month Independence Integration Test - Full Scenario', () => {
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

  it('should upload May data for both branches and calculate correct metrics', async () => {
    const mayDate = new Date(2026, 4, 15); // May 15, 2026

    // Upload Tema May inventory (dead stock - no sales)
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: temaBranchId,
      productName: 'Tema Product May',
      sku: 'TEMA-PROD-2026-05',
      quantity: 100,
      price: 10.00,
      costPrice: 5.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: mayDate,
    });

    // Upload Kasoa May inventory (dead stock - no sales)
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: kasoaBranchId,
      productName: 'Kasoa Product May',
      sku: 'KASOA-PROD-2026-05',
      quantity: 80,
      price: 8.00,
      costPrice: 4.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: mayDate,
    });

    // Verify Tema May metrics
    const temaMayMetrics = await getBranchMetrics(temaBranchId, '2026-05');
    expect(temaMayMetrics?.deadStockCount).toBe(1);
    expect(temaMayMetrics?.deadStockValue).toBe(500.00); // 100 * 5.00

    // Verify Kasoa May metrics
    const kasoaMayMetrics = await getBranchMetrics(kasoaBranchId, '2026-05');
    expect(kasoaMayMetrics?.deadStockCount).toBe(1);
    expect(kasoaMayMetrics?.deadStockValue).toBe(320.00); // 80 * 4.00

    // Verify consolidated May metrics
    const consolidatedMay = await getConsolidatedMetrics(testOrgId, '2026-05');
    expect(consolidatedMay?.deadStockCount).toBe(2);
    expect(consolidatedMay?.deadStockValue).toBe(820.00); // 500 + 320
  });

  it('should upload June data and NOT affect May metrics', async () => {
    const mayDate = new Date(2026, 4, 15); // May 15, 2026
    const juneDate = new Date(2026, 5, 15); // June 15, 2026

    // Store May metrics BEFORE June upload
    const temaMayBeforeJune = await getBranchMetrics(temaBranchId, '2026-05');
    const kasoaMayBeforeJune = await getBranchMetrics(kasoaBranchId, '2026-05');
    const consolidatedMayBefore = await getConsolidatedMetrics(testOrgId, '2026-05');

    // Upload Tema June inventory
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: temaBranchId,
      productName: 'Tema Product June',
      sku: 'TEMA-PROD-2026-06',
      quantity: 150,
      price: 12.00,
      costPrice: 6.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: juneDate,
    });

    // Upload Kasoa June inventory
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: kasoaBranchId,
      productName: 'Kasoa Product June',
      sku: 'KASOA-PROD-2026-06',
      quantity: 120,
      price: 9.00,
      costPrice: 4.50,
      expiryDate: new Date(2026, 11, 31),
      createdAt: juneDate,
    });

    // Verify May metrics are UNCHANGED after June upload
    const temaMayAfterJune = await getBranchMetrics(temaBranchId, '2026-05');
    expect(temaMayAfterJune?.deadStockCount).toBe(temaMayBeforeJune?.deadStockCount);
    expect(temaMayAfterJune?.deadStockValue).toBe(temaMayBeforeJune?.deadStockValue);

    const kasoaMayAfterJune = await getBranchMetrics(kasoaBranchId, '2026-05');
    expect(kasoaMayAfterJune?.deadStockCount).toBe(kasoaMayBeforeJune?.deadStockCount);
    expect(kasoaMayAfterJune?.deadStockValue).toBe(kasoaMayBeforeJune?.deadStockValue);

    const consolidatedMayAfter = await getConsolidatedMetrics(testOrgId, '2026-05');
    expect(consolidatedMayAfter?.deadStockCount).toBe(consolidatedMayBefore?.deadStockCount);
    expect(consolidatedMayAfter?.deadStockValue).toBe(consolidatedMayBefore?.deadStockValue);
  });

  it('should calculate correct June metrics independently', async () => {
    const juneDate = new Date(2026, 5, 15); // June 15, 2026

    // Verify Tema June metrics
    const temaJuneMetrics = await getBranchMetrics(temaBranchId, '2026-06');
    expect(temaJuneMetrics?.deadStockCount).toBe(1);
    expect(temaJuneMetrics?.deadStockValue).toBe(900.00); // 150 * 6.00

    // Verify Kasoa June metrics
    const kasaoJuneMetrics = await getBranchMetrics(kasoaBranchId, '2026-06');
    expect(kasaoJuneMetrics?.deadStockCount).toBe(1);
    expect(kasaoJuneMetrics?.deadStockValue).toBe(540.00); // 120 * 4.50

    // Verify consolidated June metrics
    const consolidatedJune = await getConsolidatedMetrics(testOrgId, '2026-06');
    expect(consolidatedJune?.deadStockCount).toBe(2);
    expect(consolidatedJune?.deadStockValue).toBe(1440.00); // 900 + 540
  });

  it('should maintain complete isolation: May=820, June=1440, Total=2260', async () => {
    // Final verification that both months are completely independent
    const temaMay = await getBranchMetrics(temaBranchId, '2026-05');
    const kasoaMay = await getBranchMetrics(kasoaBranchId, '2026-05');
    const temaJune = await getBranchMetrics(temaBranchId, '2026-06');
    const kasaoJune = await getBranchMetrics(kasoaBranchId, '2026-06');

    // Verify May total
    const mayTotal = (temaMay?.deadStockValue || 0) + (kasoaMay?.deadStockValue || 0);
    expect(mayTotal).toBe(820.00);

    // Verify June total
    const juneTotal = (temaJune?.deadStockValue || 0) + (kasaoJune?.deadStockValue || 0);
    expect(juneTotal).toBe(1440.00);

    // Verify grand total
    const grandTotal = mayTotal + juneTotal;
    expect(grandTotal).toBe(2260.00);

    // Verify consolidated metrics match
    const consolidatedMay = await getConsolidatedMetrics(testOrgId, '2026-05');
    const consolidatedJune = await getConsolidatedMetrics(testOrgId, '2026-06');

    expect(consolidatedMay?.deadStockValue).toBe(820.00);
    expect(consolidatedJune?.deadStockValue).toBe(1440.00);
  });

  it('should handle sequential uploads without cross-contamination', async () => {
    const mayDate = new Date(2026, 4, 20);
    const juneDate = new Date(2026, 5, 20);
    const julyDate = new Date(2026, 6, 20);

    // Upload May product
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: temaBranchId,
      productName: 'Sequential Test May',
      sku: 'SEQ-TEST-2026-05',
      quantity: 50,
      price: 5.00,
      costPrice: 2.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: mayDate,
    });

    const mayMetrics = await getBranchMetrics(temaBranchId, '2026-05');
    const mayDeadStock = mayMetrics?.deadStockValue || 0;

    // Upload June product
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: temaBranchId,
      productName: 'Sequential Test June',
      sku: 'SEQ-TEST-2026-06',
      quantity: 60,
      price: 6.00,
      costPrice: 3.00,
      expiryDate: new Date(2026, 11, 31),
      createdAt: juneDate,
    });

    // Verify May is unchanged
    const mayMetricsAfterJune = await getBranchMetrics(temaBranchId, '2026-05');
    expect(mayMetricsAfterJune?.deadStockValue).toBe(mayDeadStock);

    // Upload July product
    await upsertInventoryItem({
      userId: TEST_USER_ID,
      branchId: temaBranchId,
      productName: 'Sequential Test July',
      sku: 'SEQ-TEST-2026-07',
      quantity: 70,
      price: 7.00,
      costPrice: 3.50,
      expiryDate: new Date(2026, 11, 31),
      createdAt: julyDate,
    });

    // Verify May and June are still unchanged
    const mayMetricsAfterJuly = await getBranchMetrics(temaBranchId, '2026-05');
    expect(mayMetricsAfterJuly?.deadStockValue).toBe(mayDeadStock);

    const juneMetricsAfterJuly = await getBranchMetrics(temaBranchId, '2026-06');
    const juneDeadStock = juneMetricsAfterJuly?.deadStockValue || 0;
    expect(juneDeadStock).toBeGreaterThanOrEqual(180.00); // At least 60 * 3.00

    // Verify July has its own data
    const julyMetrics = await getBranchMetrics(temaBranchId, '2026-07');
    expect(julyMetrics?.deadStockValue).toBeGreaterThanOrEqual(245.00); // At least 70 * 3.50
  });
});
