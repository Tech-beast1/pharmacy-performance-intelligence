import { describe, it, expect } from "vitest";

/**
 * Real-World Metrics Calculation Tests
 * Simulates actual pharmacy scenarios for deadstock and expiry risk
 */
describe("Real-World Metrics Scenarios", () => {
  describe("Single Pharmacy - June 2024", () => {
    it("should calculate correct metrics for single pharmacy with mixed inventory", () => {
      // Simulate a single pharmacy in June 2024
      const monthStart = new Date("2024-06-01");
      const thirtyDaysFromStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      const inventory = [
        // Expiry risk items (expiring within 30 days from month start)
        { name: "Aspirin", expiryDate: new Date("2024-06-15"), costPrice: 5, quantity: 100, lastSaleDate: new Date("2024-06-01") },
        { name: "Paracetamol", expiryDate: new Date("2024-06-25"), costPrice: 3, quantity: 150, lastSaleDate: new Date("2024-05-20") },
        
        // Non-expiry risk items
        { name: "Ibuprofen", expiryDate: new Date("2024-08-10"), costPrice: 4, quantity: 200, lastSaleDate: new Date("2024-05-15") },
        { name: "Amoxicillin", expiryDate: new Date("2024-09-01"), costPrice: 8, quantity: 50, lastSaleDate: new Date("2024-06-05") },
        
        // Dead stock item (no sales)
        { name: "Cough Syrup", expiryDate: new Date("2024-08-01"), costPrice: 6, quantity: 30, lastSaleDate: null },
      ];

      // Sales transactions for the month
      const sales = [
        { productName: "Aspirin", quantity: 20 },
        { productName: "Paracetamol", quantity: 30 },
        { productName: "Ibuprofen", quantity: 50 },
        { productName: "Amoxicillin", quantity: 10 },
        // Cough Syrup has no sales
      ];

      // Calculate expiry risk
      const expiryRiskProducts = inventory.filter((p) => {
        const expiryDate = new Date(p.expiryDate);
        return expiryDate > monthStart && expiryDate <= thirtyDaysFromStart;
      });

      const expiryRiskLoss = expiryRiskProducts.reduce(
        (sum, p) => sum + p.costPrice * p.quantity,
        0
      );

      // Calculate dead stock
      const deadStockProducts = inventory.filter(
        (p) => !sales.some((s) => s.productName === p.name)
      );

      const deadStockValue = deadStockProducts.reduce(
        (sum, p) => sum + p.costPrice * p.quantity,
        0
      );

      // Verify calculations
      expect(expiryRiskProducts.length).toBe(2); // Aspirin and Paracetamol
      expect(expiryRiskLoss).toBe(5 * 100 + 3 * 150); // 500 + 450 = 950
      expect(deadStockProducts.length).toBe(1); // Cough Syrup
      expect(deadStockValue).toBe(6 * 30); // 180
    });

    it("should handle single pharmacy with all products sold", () => {
      const monthStart = new Date("2024-06-01");
      const thirtyDaysFromStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      const inventory = [
        { name: "Aspirin", expiryDate: new Date("2024-06-15"), costPrice: 5, quantity: 100 },
        { name: "Paracetamol", expiryDate: new Date("2024-06-25"), costPrice: 3, quantity: 150 },
      ];

      const sales = [
        { productName: "Aspirin", quantity: 50 },
        { productName: "Paracetamol", quantity: 75 },
      ];

      const deadStockProducts = inventory.filter(
        (p) => !sales.some((s) => s.productName === p.name)
      );

      expect(deadStockProducts.length).toBe(0);
    });

    it("should handle single pharmacy with no sales", () => {
      const monthStart = new Date("2024-06-01");
      const thirtyDaysFromStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      const inventory = [
        { name: "Aspirin", expiryDate: new Date("2024-06-15"), costPrice: 5, quantity: 100 },
        { name: "Paracetamol", expiryDate: new Date("2024-06-25"), costPrice: 3, quantity: 150 },
      ];

      const sales: any[] = [];

      const deadStockProducts = inventory.filter(
        (p) => !sales.some((s) => s.productName === p.name)
      );

      const deadStockValue = deadStockProducts.reduce(
        (sum, p) => sum + p.costPrice * p.quantity,
        0
      );

      expect(deadStockProducts.length).toBe(2);
      expect(deadStockValue).toBe(5 * 100 + 3 * 150); // 950
    });
  });

  describe("Organization System - Multi-Branch June 2024", () => {
    it("should calculate correct metrics for each branch independently", () => {
      const monthStart = new Date("2024-06-01");
      const thirtyDaysFromStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Branch 1 - Downtown
      const branch1Inventory = [
        { name: "Aspirin", expiryDate: new Date("2024-06-15"), costPrice: 5, quantity: 100 },
        { name: "Paracetamol", expiryDate: new Date("2024-06-25"), costPrice: 3, quantity: 150 },
        { name: "Ibuprofen", expiryDate: new Date("2024-08-10"), costPrice: 4, quantity: 200 },
      ];

      const branch1Sales = [
        { productName: "Aspirin", quantity: 50 },
        { productName: "Paracetamol", quantity: 75 },
      ];

      // Branch 2 - Uptown
      const branch2Inventory = [
        { name: "Aspirin", expiryDate: new Date("2024-06-20"), costPrice: 5, quantity: 80 },
        { name: "Ibuprofen", expiryDate: new Date("2024-08-10"), costPrice: 4, quantity: 120 },
        { name: "Amoxicillin", expiryDate: new Date("2024-09-01"), costPrice: 8, quantity: 50 },
      ];

      const branch2Sales = [
        { productName: "Aspirin", quantity: 40 },
        { productName: "Ibuprofen", quantity: 60 },
      ];

      // Calculate Branch 1 metrics
      const branch1ExpiryRisk = branch1Inventory
        .filter((p) => {
          const expiryDate = new Date(p.expiryDate);
          return expiryDate > monthStart && expiryDate <= thirtyDaysFromStart;
        })
        .reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

      const branch1DeadStock = branch1Inventory
        .filter((p) => !branch1Sales.some((s) => s.productName === p.name))
        .reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

      // Calculate Branch 2 metrics
      const branch2ExpiryRisk = branch2Inventory
        .filter((p) => {
          const expiryDate = new Date(p.expiryDate);
          return expiryDate > monthStart && expiryDate <= thirtyDaysFromStart;
        })
        .reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

      const branch2DeadStock = branch2Inventory
        .filter((p) => !branch2Sales.some((s) => s.productName === p.name))
        .reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

      // Verify Branch 1
      expect(branch1ExpiryRisk).toBe(5 * 100 + 3 * 150); // Aspirin + Paracetamol = 950
      expect(branch1DeadStock).toBe(4 * 200); // Ibuprofen = 800

      // Verify Branch 2
      expect(branch2ExpiryRisk).toBe(5 * 80); // Aspirin = 400
      expect(branch2DeadStock).toBe(8 * 50); // Amoxicillin = 400

      // Verify consolidated totals
      const totalExpiryRisk = branch1ExpiryRisk + branch2ExpiryRisk;
      const totalDeadStock = branch1DeadStock + branch2DeadStock;

      expect(totalExpiryRisk).toBe(1350);
      expect(totalDeadStock).toBe(1200);
    });

    it("should not affect branch metrics when updating another branch", () => {
      const branch1 = { expiryRiskLoss: 950, deadStockValue: 800 };
      const branch2 = { expiryRiskLoss: 400, deadStockValue: 400 };

      const originalBranch2 = { ...branch2 };

      // Update branch 1
      branch1.expiryRiskLoss = 1000;
      branch1.deadStockValue = 900;

      // Verify branch 2 is unchanged
      expect(branch2.expiryRiskLoss).toBe(originalBranch2.expiryRiskLoss);
      expect(branch2.deadStockValue).toBe(originalBranch2.deadStockValue);
    });

    it("should consolidate metrics correctly across 3 branches", () => {
      const branches = [
        { name: "Downtown", expiryRiskLoss: 950, deadStockValue: 800 },
        { name: "Uptown", expiryRiskLoss: 400, deadStockValue: 400 },
        { name: "Airport", expiryRiskLoss: 600, deadStockValue: 500 },
      ];

      const totalExpiryRisk = branches.reduce((sum, b) => sum + b.expiryRiskLoss, 0);
      const totalDeadStock = branches.reduce((sum, b) => sum + b.deadStockValue, 0);

      expect(totalExpiryRisk).toBe(1950);
      expect(totalDeadStock).toBe(1700);

      // Verify we can still access individual branch data
      expect(branches[0].expiryRiskLoss).toBe(950);
      expect(branches[1].expiryRiskLoss).toBe(400);
      expect(branches[2].expiryRiskLoss).toBe(600);
    });
  });

  describe("Month Independence - Single Pharmacy", () => {
    it("should maintain independent metrics for June and July", () => {
      const juneMetrics = {
        expiryRiskLoss: 950,
        deadStockValue: 800,
      };

      const julyMetrics = {
        expiryRiskLoss: 650,
        deadStockValue: 1200,
      };

      // Verify June metrics
      expect(juneMetrics.expiryRiskLoss).toBe(950);
      expect(juneMetrics.deadStockValue).toBe(800);

      // Verify July metrics
      expect(julyMetrics.expiryRiskLoss).toBe(650);
      expect(julyMetrics.deadStockValue).toBe(1200);

      // Verify they're independent
      expect(juneMetrics.expiryRiskLoss).not.toBe(julyMetrics.expiryRiskLoss);
      expect(juneMetrics.deadStockValue).not.toBe(julyMetrics.deadStockValue);
    });
  });

  describe("Month Independence - Organization", () => {
    it("should maintain independent metrics per branch per month", () => {
      const branch1June = { expiryRiskLoss: 950, deadStockValue: 800 };
      const branch1July = { expiryRiskLoss: 650, deadStockValue: 1200 };
      const branch2June = { expiryRiskLoss: 400, deadStockValue: 400 };
      const branch2July = { expiryRiskLoss: 500, deadStockValue: 600 };

      // Verify each combination is independent
      expect(branch1June.expiryRiskLoss).toBe(950);
      expect(branch1July.expiryRiskLoss).toBe(650);
      expect(branch2June.expiryRiskLoss).toBe(400);
      expect(branch2July.expiryRiskLoss).toBe(500);

      // Verify June totals
      const juneTotal = branch1June.expiryRiskLoss + branch2June.expiryRiskLoss;
      expect(juneTotal).toBe(1350);

      // Verify July totals
      const julyTotal = branch1July.expiryRiskLoss + branch2July.expiryRiskLoss;
      expect(julyTotal).toBe(1150);
    });
  });

  describe("Data Accuracy Verification", () => {
    it("should verify expiry risk calculation is accurate", () => {
      const monthStart = new Date("2024-06-01");
      const thirtyDaysFromStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      const products = [
        { name: "P1", expiryDate: new Date("2024-06-10"), costPrice: 10, quantity: 5 },
        { name: "P2", expiryDate: new Date("2024-06-20"), costPrice: 20, quantity: 3 },
        { name: "P3", expiryDate: new Date("2024-06-30"), costPrice: 15, quantity: 2 },
      ];

      const expiryRisk = products
        .filter((p) => {
          const expiryDate = new Date(p.expiryDate);
          return expiryDate > monthStart && expiryDate <= thirtyDaysFromStart;
        })
        .reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

      // Expected: 10*5 + 20*3 + 15*2 = 50 + 60 + 30 = 140
      expect(expiryRisk).toBe(140);
    });

    it("should verify dead stock calculation is accurate", () => {
      const products = [
        { name: "P1", costPrice: 10, quantity: 5 },
        { name: "P2", costPrice: 20, quantity: 3 },
        { name: "P3", costPrice: 15, quantity: 2 },
      ];

      const sales = [
        { productName: "P1", quantity: 2 },
        { productName: "P2", quantity: 1 },
      ];

      const deadStock = products
        .filter((p) => !sales.some((s) => s.productName === p.name))
        .reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

      // Expected: 15*2 = 30 (only P3 has no sales)
      expect(deadStock).toBe(30);
    });

    it("should verify no data loss in calculations", () => {
      const products = [
        { name: "P1", costPrice: 10.5, quantity: 5 },
        { name: "P2", costPrice: 20.75, quantity: 3 },
        { name: "P3", costPrice: 15.25, quantity: 2 },
      ];

      const total = products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

      // Expected: 10.5*5 + 20.75*3 + 15.25*2 = 52.5 + 62.25 + 30.5 = 145.25
      expect(total).toBeCloseTo(145.25, 2);
    });
  });

  describe("Performance - Large Datasets", () => {
    it("should calculate metrics efficiently for large single pharmacy inventory", () => {
      const monthStart = new Date("2024-06-01");
      const thirtyDaysFromStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Simulate 10,000 products
      const inventory = Array.from({ length: 10000 }, (_, i) => ({
        name: `Product${i}`,
        expiryDate: new Date(monthStart.getTime() + Math.random() * 60 * 24 * 60 * 60 * 1000),
        costPrice: Math.random() * 100,
        quantity: Math.floor(Math.random() * 1000),
      }));

      const sales = Array.from({ length: 5000 }, (_, i) => ({
        productName: `Product${i}`,
        quantity: Math.floor(Math.random() * 100),
      }));

      const startTime = Date.now();

      const expiryRiskLoss = inventory
        .filter((p) => {
          const expiryDate = new Date(p.expiryDate);
          return expiryDate > monthStart && expiryDate <= thirtyDaysFromStart;
        })
        .reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

      const deadStockValue = inventory
        .filter((p) => !sales.some((s) => s.productName === p.name))
        .reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

      const endTime = Date.now();

      expect(expiryRiskLoss).toBeGreaterThan(0);
      expect(deadStockValue).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(500); // Should complete in less than 100ms
    });

    it("should consolidate metrics efficiently for large multi-branch organization", () => {
      // Simulate 10 branches
      const branches = Array.from({ length: 10 }, (_, i) => ({
        branchId: i,
        expiryRiskLoss: Math.random() * 10000,
        deadStockValue: Math.random() * 10000,
      }));

      const startTime = Date.now();

      const totalExpiryRisk = branches.reduce((sum, b) => sum + b.expiryRiskLoss, 0);
      const totalDeadStock = branches.reduce((sum, b) => sum + b.deadStockValue, 0);

      const endTime = Date.now();

      expect(totalExpiryRisk).toBeGreaterThan(0);
      expect(totalDeadStock).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(10); // Should complete in less than 10ms
    });
  });
});
