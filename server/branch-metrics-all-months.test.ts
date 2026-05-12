import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { getConsolidatedMetrics, getBranchMetrics } from './db-branches';

describe('Branch Metrics - All Months with Branch Assignment', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  afterAll(async () => {
    if (db) {
      // Cleanup is handled by the database
    }
  });

  it('should retrieve consolidated metrics for May 2026 with branch assignments', async () => {
    // Organization ID 11 has 2 branches (Tema: 20, Kasoa: 300012)
    const metrics = await getConsolidatedMetrics(11, '2026-05');
    
    expect(metrics).toBeDefined();
    expect(metrics?.totalRevenue).toBeGreaterThan(0);
    expect(metrics?.estimatedProfit).toBeGreaterThan(0);
    expect(metrics?.branches).toBeDefined();
    expect(metrics?.branches.length).toBe(2);
    
    // Verify both branches have data
    const temaMetrics = await getBranchMetrics(20, '2026-05');
    const kaoaMetrics = await getBranchMetrics(300012, '2026-05');
    
    expect(temaMetrics?.totalRevenue).toBeGreaterThan(0);
    expect(kaoaMetrics?.totalRevenue).toBeGreaterThan(0);
    
    // Verify consolidated is sum of branches
    const expectedTotal = (temaMetrics?.totalRevenue || 0) + (kaoaMetrics?.totalRevenue || 0);
    expect(metrics?.totalRevenue).toBe(expectedTotal);
  });

  it('should retrieve consolidated metrics for April 2026 (has more data)', async () => {
    const metrics = await getConsolidatedMetrics(11, '2026-04');
    
    expect(metrics).toBeDefined();
    expect(metrics?.totalRevenue).toBeGreaterThan(0);
    expect(metrics?.estimatedProfit).toBeGreaterThan(0);
    
    // April has more data (749 sales) so should have higher revenue than May
    const mayMetrics = await getConsolidatedMetrics(11, '2026-05');
    expect(metrics?.totalRevenue).toBeGreaterThan(mayMetrics?.totalRevenue || 0);
  });

  it('should return zero metrics for months with no data', async () => {
    const metrics = await getConsolidatedMetrics(11, '2026-03');
    
    expect(metrics).toBeDefined();
    expect(metrics?.totalRevenue).toBe(0);
    expect(metrics?.estimatedProfit).toBe(0);
  });

  it('should not mix data between different months', async () => {
    const mayMetrics = await getConsolidatedMetrics(11, '2026-05');
    const aprilMetrics = await getConsolidatedMetrics(11, '2026-04');
    
    // Verify they're different
    expect(mayMetrics?.totalRevenue).not.toBe(aprilMetrics?.totalRevenue);
    
    // Verify May has correct data (80 sales)
    expect(mayMetrics?.totalRevenue).toBe(8226.50);
    
    // Verify April has correct data (749 sales)
    expect(aprilMetrics?.totalRevenue).toBeGreaterThan(mayMetrics?.totalRevenue || 0);
  });

  it('should handle invalid month format gracefully', async () => {
    const metrics = await getConsolidatedMetrics(11, 'invalid');
    expect(metrics).toBeDefined();
    expect(metrics?.totalRevenue).toBe(0);
  });
});
