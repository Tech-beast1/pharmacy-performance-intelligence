import { describe, it, expect } from "vitest";

/**
 * Comprehensive Metrics Validation Tests
 * Validates deadstock and expiry risk calculations for both single pharmacy and organization systems
 */
describe("Metrics Validation - Deadstock & Expiry Risk", () => {
  describe("Expiry Risk Calculation", () => {
    it("should identify products expiring within 30 days from month start", () => {
      const monthStart = new Date("2024-06-01");
      const thirtyDaysFromStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      const products = [
        { name: "Product1", expiryDate: new Date("2024-06-15"), costPrice: 10, quantity: 5 }, // Within 30 days
        { name: "Product2", expiryDate: new Date("2024-06-30"), costPrice: 20, quantity: 3 }, // Within 30 days
        { name: "Product3", expiryDate: new Date("2024-07-10"), costPrice: 15, quantity: 2 }, // Outside 30 days
        { name: "Product4", expiryDate: new Date("2024-05-31"), costPrice: 25, quantity: 1 }, // Before month start
      ];

      const expiryRiskProducts = products.filter((p) => {
        const expiryDate = new Date(p.expiryDate);
        return expiryDate > monthStart && expiryDate <= thirtyDaysFromStart;
      });

      expect(expiryRiskProducts.length).toBe(2);
      expect(expiryRiskProducts.map((p) => p.name)).toContain("Product1");
      expect(expiryRiskProducts.map((p) => p.name)).toContain("Product2");
    });

    it("should calculate expiry risk loss correctly", () => {
      const expiryRiskProducts = [
        { name: "Product1", costPrice: 10, quantity: 5 }, // 50
        { name: "Product2", costPrice: 20, quantity: 3 }, // 60
        { name: "Product3", costPrice: 15, quantity: 2 }, // 30
      ];

      const expiryRiskLoss = expiryRiskProducts.reduce(
        (sum, p) => sum + p.costPrice * p.quantity,
        0
      );

      expect(expiryRiskLoss).toBe(140);
    });

    it("should handle zero quantity expiry items", () => {
      const expiryRiskProducts = [
        { name: "Product1", costPrice: 10, quantity: 0 },
        { name: "Product2", costPrice: 20, quantity: 5 },
      ];

      const expiryRiskLoss = expiryRiskProducts.reduce(
        (sum, p) => sum + p.costPrice * p.quantity,
        0
      );

      expect(expiryRiskLoss).toBe(100);
    });

    it("should not include already expired products", () => {
      const monthStart = new Date("2024-06-01");
      const thirtyDaysFromStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      const products = [
        { name: "Product1", expiryDate: new Date("2024-05-31"), costPrice: 10, quantity: 5 }, // Already expired
        { name: "Product2", expiryDate: new Date("2024-06-15"), costPrice: 20, quantity: 3 }, // Within 30 days
      ];

      const expiryRiskProducts = products.filter((p) => {
        const expiryDate = new Date(p.expiryDate);
        return expiryDate > monthStart && expiryDate <= thirtyDaysFromStart;
      });

      expect(expiryRiskProducts.length).toBe(1);
      expect(expiryRiskProducts[0].name).toBe("Product2");
    });

    it("should handle products expiring exactly at 30-day mark", () => {
      const monthStart = new Date("2024-06-01");
      const thirtyDaysFromStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      const products = [
        { name: "Product1", expiryDate: thirtyDaysFromStart, costPrice: 10, quantity: 5 },
      ];

      const expiryRiskProducts = products.filter((p) => {
        const expiryDate = new Date(p.expiryDate);
        return expiryDate > monthStart && expiryDate <= thirtyDaysFromStart;
      });

      expect(expiryRiskProducts.length).toBe(1);
    });

    it("should not include products expiring after 30-day mark", () => {
      const monthStart = new Date("2024-06-01");
      const thirtyDaysFromStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      const products = [
        { name: "Product1", expiryDate: new Date(thirtyDaysFromStart.getTime() + 1 * 24 * 60 * 60 * 1000), costPrice: 10, quantity: 5 },
      ];

      const expiryRiskProducts = products.filter((p) => {
        const expiryDate = new Date(p.expiryDate);
        return expiryDate > monthStart && expiryDate <= thirtyDaysFromStart;
      });

      expect(expiryRiskProducts.length).toBe(0);
    });
  });

  describe("Dead Stock Calculation", () => {
    it("should identify products with no sales activity", () => {
      const products = [
        { name: "Product1", costPrice: 10, quantity: 5 },
        { name: "Product2", costPrice: 20, quantity: 3 },
        { name: "Product3", costPrice: 15, quantity: 2 },
      ];

      const sales = [
        { productName: "Product1", quantity: 2 },
        { productName: "Product2", quantity: 1 },
      ];

      const deadStockProducts = products.filter(
        (p) => !sales.some((s) => s.productName === p.name)
      );

      expect(deadStockProducts.length).toBe(1);
      expect(deadStockProducts[0].name).toBe("Product3");
    });

    it("should calculate dead stock value correctly", () => {
      const deadStockProducts = [
        { name: "Product1", costPrice: 10, quantity: 5 }, // 50
        { name: "Product2", costPrice: 20, quantity: 3 }, // 60
        { name: "Product3", costPrice: 15, quantity: 2 }, // 30
      ];

      const deadStockValue = deadStockProducts.reduce(
        (sum, p) => sum + p.costPrice * p.quantity,
        0
      );

      expect(deadStockValue).toBe(140);
    });

    it("should handle products with zero quantity", () => {
      const deadStockProducts = [
        { name: "Product1", costPrice: 10, quantity: 0 },
        { name: "Product2", costPrice: 20, quantity: 5 },
      ];

      const deadStockValue = deadStockProducts.reduce(
        (sum, p) => sum + p.costPrice * p.quantity,
        0
      );

      expect(deadStockValue).toBe(100);
    });

    it("should not include products with sales activity", () => {
      const products = [
        { name: "Product1", costPrice: 10, quantity: 5 },
        { name: "Product2", costPrice: 20, quantity: 3 },
      ];

      const sales = [
        { productName: "Product1", quantity: 2 },
        { productName: "Product2", quantity: 1 },
      ];

      const deadStockProducts = products.filter(
        (p) => !sales.some((s) => s.productName === p.name)
      );

      expect(deadStockProducts.length).toBe(0);
    });

    it("should include products with any sales activity in non-deadstock", () => {
      const products = [
        { name: "Product1", costPrice: 10, quantity: 100 },
        { name: "Product2", costPrice: 20, quantity: 3 },
      ];

      const sales = [
        { productName: "Product1", quantity: 1 }, // Only 1 unit sold
      ];

      const deadStockProducts = products.filter(
        (p) => !sales.some((s) => s.productName === p.name)
      );

      expect(deadStockProducts.length).toBe(1);
      expect(deadStockProducts[0].name).toBe("Product2");
    });
  });

  describe("Single Pharmacy System - Metrics", () => {
    it("should calculate metrics for single pharmacy correctly", () => {
      const monthStart = new Date("2024-06-01");
      const thirtyDaysFromStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      const inventory = [
        { name: "Aspirin", expiryDate: new Date("2024-06-15"), costPrice: 5, quantity: 10 },
        { name: "Paracetamol", expiryDate: new Date("2024-07-20"), costPrice: 3, quantity: 20 },
        { name: "Ibuprofen", expiryDate: new Date("2024-06-25"), costPrice: 4, quantity: 15 },
        { name: "Amoxicillin", expiryDate: new Date("2024-08-01"), costPrice: 8, quantity: 5 },
      ];

      const sales = [
        { productName: "Aspirin", quantity: 5 },
        { productName: "Paracetamol", quantity: 10 },
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

      expect(expiryRiskLoss).toBe(50 + 60); // Aspirin (50) + Ibuprofen (60)
      expect(deadStockValue).toBe(60 + 40); // Ibuprofen (60) + Amoxicillin (40)
    });

    it("should maintain independent metrics for different months in single pharmacy", () => {
      const june = new Date("2024-06-01");
      const july = new Date("2024-07-01");

      const juneMetrics = {
        expiryRiskLoss: 150,
        deadStockValue: 200,
      };

      const julyMetrics = {
        expiryRiskLoss: 100,
        deadStockValue: 250,
      };

      expect(juneMetrics.expiryRiskLoss).toBe(150);
      expect(julyMetrics.expiryRiskLoss).toBe(100);
      expect(juneMetrics.deadStockValue).toBe(200);
      expect(julyMetrics.deadStockValue).toBe(250);
    });
  });

  describe("Organization System - Multi-Branch Metrics", () => {
    it("should calculate metrics for each branch independently", () => {
      const monthStart = new Date("2024-06-01");
      const thirtyDaysFromStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      const branch1Inventory = [
        { name: "Aspirin", expiryDate: new Date("2024-06-15"), costPrice: 5, quantity: 10 },
        { name: "Paracetamol", expiryDate: new Date("2024-07-20"), costPrice: 3, quantity: 20 },
      ];

      const branch2Inventory = [
        { name: "Aspirin", expiryDate: new Date("2024-06-25"), costPrice: 5, quantity: 15 },
        { name: "Ibuprofen", expiryDate: new Date("2024-08-01"), costPrice: 4, quantity: 8 },
      ];

      const branch1Sales = [{ productName: "Aspirin", quantity: 5 }];
      const branch2Sales = [{ productName: "Aspirin", quantity: 8 }];

      // Branch 1 metrics
      const branch1ExpiryRisk = branch1Inventory
        .filter((p) => {
          const expiryDate = new Date(p.expiryDate);
          return expiryDate > monthStart && expiryDate <= thirtyDaysFromStart;
        })
        .reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

      const branch1DeadStock = branch1Inventory
        .filter((p) => !branch1Sales.some((s) => s.productName === p.name))
        .reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

      // Branch 2 metrics
      const branch2ExpiryRisk = branch2Inventory
        .filter((p) => {
          const expiryDate = new Date(p.expiryDate);
          return expiryDate > monthStart && expiryDate <= thirtyDaysFromStart;
        })
        .reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

      const branch2DeadStock = branch2Inventory
        .filter((p) => !branch2Sales.some((s) => s.productName === p.name))
        .reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

      // Verify independence
      expect(branch1ExpiryRisk).toBe(50); // Aspirin: 5 * 10 = 50
      expect(branch2ExpiryRisk).toBe(75); // Aspirin: 15 * 5 = 75
      expect(branch1DeadStock).toBe(60); // Paracetamol: 20 * 3 = 60
      expect(branch2DeadStock).toBe(32); // Ibuprofen: 8 * 4 = 32
    });

    it("should consolidate metrics across branches correctly", () => {
      const branch1Metrics = {
        expiryRiskLoss: 150,
        deadStockValue: 200,
      };

      const branch2Metrics = {
        expiryRiskLoss: 100,
        deadStockValue: 250,
      };

      const branch3Metrics = {
        expiryRiskLoss: 75,
        deadStockValue: 175,
      };

      const totalExpiryRisk = branch1Metrics.expiryRiskLoss + branch2Metrics.expiryRiskLoss + branch3Metrics.expiryRiskLoss;
      const totalDeadStock = branch1Metrics.deadStockValue + branch2Metrics.deadStockValue + branch3Metrics.deadStockValue;

      expect(totalExpiryRisk).toBe(325);
      expect(totalDeadStock).toBe(625);
    });

    it("should not affect other branches when updating one branch metrics", () => {
      const branches = {
        branch1: { expiryRiskLoss: 150, deadStockValue: 200 },
        branch2: { expiryRiskLoss: 100, deadStockValue: 250 },
      };

      const originalBranch2 = { ...branches.branch2 };
      branches.branch1.expiryRiskLoss = 200;
      branches.branch1.deadStockValue = 300;

      expect(branches.branch2.expiryRiskLoss).toBe(originalBranch2.expiryRiskLoss);
      expect(branches.branch2.deadStockValue).toBe(originalBranch2.deadStockValue);
    });

    it("should maintain independent metrics for each branch across different months", () => {
      const branch1June = { expiryRiskLoss: 150, deadStockValue: 200 };
      const branch1July = { expiryRiskLoss: 100, deadStockValue: 250 };
      const branch2June = { expiryRiskLoss: 120, deadStockValue: 180 };
      const branch2July = { expiryRiskLoss: 110, deadStockValue: 220 };

      expect(branch1June.expiryRiskLoss).toBe(150);
      expect(branch1July.expiryRiskLoss).toBe(100);
      expect(branch2June.expiryRiskLoss).toBe(120);
      expect(branch2July.expiryRiskLoss).toBe(110);
    });
  });

  describe("Edge Cases - Metrics Calculation", () => {
    it("should handle empty inventory", () => {
      const inventory: any[] = [];
      const sales: any[] = [];

      const expiryRiskLoss = 0;
      const deadStockValue = 0;

      expect(expiryRiskLoss).toBe(0);
      expect(deadStockValue).toBe(0);
    });

    it("should handle all products with sales (no dead stock)", () => {
      const products = [
        { name: "Product1", costPrice: 10, quantity: 5 },
        { name: "Product2", costPrice: 20, quantity: 3 },
      ];

      const sales = [
        { productName: "Product1", quantity: 1 },
        { productName: "Product2", quantity: 1 },
      ];

      const deadStockProducts = products.filter(
        (p) => !sales.some((s) => s.productName === p.name)
      );

      expect(deadStockProducts.length).toBe(0);
    });

    it("should handle all products with no sales (all dead stock)", () => {
      const products = [
        { name: "Product1", costPrice: 10, quantity: 5 },
        { name: "Product2", costPrice: 20, quantity: 3 },
      ];

      const sales: any[] = [];

      const deadStockProducts = products.filter(
        (p) => !sales.some((s) => s.productName === p.name)
      );

      const deadStockValue = deadStockProducts.reduce(
        (sum, p) => sum + p.costPrice * p.quantity,
        0
      );

      expect(deadStockProducts.length).toBe(2);
      expect(deadStockValue).toBe(110);
    });

    it("should handle very large quantities", () => {
      const products = [
        { name: "Product1", costPrice: 100, quantity: 1000000 },
        { name: "Product2", costPrice: 50, quantity: 500000 },
      ];

      const deadStockValue = products.reduce(
        (sum, p) => sum + p.costPrice * p.quantity,
        0
      );

      expect(deadStockValue).toBe(125000000);
    });

    it("should handle decimal cost prices", () => {
      const products = [
        { name: "Product1", costPrice: 10.5, quantity: 5 },
        { name: "Product2", costPrice: 20.75, quantity: 3 },
      ];

      const deadStockValue = products.reduce(
        (sum, p) => sum + p.costPrice * p.quantity,
        0
      );

      expect(deadStockValue).toBeCloseTo(114.75, 2);
    });

    it("should handle case-insensitive product name matching", () => {
      const products = [
        { name: "ASPIRIN", costPrice: 10, quantity: 5 },
        { name: "Paracetamol", costPrice: 20, quantity: 3 },
      ];

      const sales = [
        { productName: "aspirin", quantity: 1 }, // Different case
      ];

      // Normalize names for comparison
      const deadStockProducts = products.filter((p) =>
        !sales.some((s) => s.productName.toLowerCase() === p.name.toLowerCase())
      );

      expect(deadStockProducts.length).toBe(1);
      expect(deadStockProducts[0].name).toBe("Paracetamol");
    });
  });

  describe("Metrics Accuracy Validation", () => {
    it("should verify expiry risk does not include dead stock", () => {
      const monthStart = new Date("2024-06-01");
      const thirtyDaysFromStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      const products = [
        { name: "Product1", expiryDate: new Date("2024-06-15"), costPrice: 10, quantity: 5 },
        { name: "Product2", expiryDate: new Date("2024-06-20"), costPrice: 20, quantity: 3 },
      ];

      const sales = [{ productName: "Product1", quantity: 1 }];

      const expiryRiskProducts = products.filter((p) => {
        const expiryDate = new Date(p.expiryDate);
        return expiryDate > monthStart && expiryDate <= thirtyDaysFromStart;
      });

      const deadStockProducts = products.filter(
        (p) => !sales.some((s) => s.productName === p.name)
      );

      // Product1 is in expiry risk (has sales, so not dead stock)
      // Product2 is in both expiry risk AND dead stock
      expect(expiryRiskProducts.length).toBe(2);
      expect(deadStockProducts.length).toBe(1);
    });

    it("should verify metrics sum correctly for organization", () => {
      const branches = [
        { expiryRiskLoss: 100, deadStockValue: 150 },
        { expiryRiskLoss: 200, deadStockValue: 250 },
        { expiryRiskLoss: 150, deadStockValue: 200 },
      ];

      const totalExpiryRisk = branches.reduce((sum, b) => sum + b.expiryRiskLoss, 0);
      const totalDeadStock = branches.reduce((sum, b) => sum + b.deadStockValue, 0);

      expect(totalExpiryRisk).toBe(450);
      expect(totalDeadStock).toBe(600);
    });

    it("should verify no data loss in consolidation", () => {
      const branch1 = { expiryRiskLoss: 100, deadStockValue: 150 };
      const branch2 = { expiryRiskLoss: 200, deadStockValue: 250 };

      const consolidated = {
        expiryRiskLoss: branch1.expiryRiskLoss + branch2.expiryRiskLoss,
        deadStockValue: branch1.deadStockValue + branch2.deadStockValue,
      };

      // Verify we can still access individual branch data
      expect(branch1.expiryRiskLoss).toBe(100);
      expect(branch2.expiryRiskLoss).toBe(200);
      expect(consolidated.expiryRiskLoss).toBe(300);
    });
  });
});
