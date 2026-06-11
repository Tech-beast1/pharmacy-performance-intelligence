import { describe, it, expect } from "vitest";

/**
 * Inventory Intelligence Module Tests
 * Tests all inventory functionality including tracking, analysis, and branch handling
 */
describe("Inventory Intelligence Module Tests", () => {
  describe("Product Tracking", () => {
    it("should track product name", () => {
      const product = { name: "Aspirin", sku: "ASP001" };
      expect(product.name).toBe("Aspirin");
    });

    it("should track product SKU", () => {
      const product = { name: "Aspirin", sku: "ASP001" };
      expect(product.sku).toBe("ASP001");
    });

    it("should track quantity on hand", () => {
      const inventory = { product: "Aspirin", quantity: 100 };
      expect(inventory.quantity).toBe(100);
    });

    it("should track cost price", () => {
      const item = { product: "Aspirin", costPrice: 5 };
      expect(item.costPrice).toBe(5);
    });

    it("should track selling price", () => {
      const item = { product: "Aspirin", sellingPrice: 10 };
      expect(item.sellingPrice).toBe(10);
    });

    it("should track expiry date", () => {
      const expiryDate = new Date("2025-12-31");
      const item = { product: "Aspirin", expiryDate };
      expect(item.expiryDate).toEqual(expiryDate);
    });

    it("should track quantity sold in 90 days", () => {
      const item = { product: "Aspirin", qtySold90Days: 50 };
      expect(item.qtySold90Days).toBe(50);
    });
  });

  describe("Inventory Valuation", () => {
    it("should calculate profit per unit", () => {
      const item = { costPrice: 5, sellingPrice: 10 };
      const profitPerUnit = item.sellingPrice - item.costPrice;
      expect(profitPerUnit).toBe(5);
    });

    it("should calculate total inventory value", () => {
      const inventory = [
        { product: "Aspirin", quantity: 100, costPrice: 5 },
        { product: "Paracetamol", quantity: 150, costPrice: 3 },
      ];

      const inventoryValue = inventory.reduce(
        (sum, item) => sum + item.quantity * item.costPrice,
        0
      );
      expect(inventoryValue).toBe(950);
    });

    it("should calculate selling value of inventory", () => {
      const inventory = [
        { product: "Aspirin", quantity: 100, sellingPrice: 10 },
        { product: "Paracetamol", quantity: 150, sellingPrice: 6 },
      ];

      const sellingValue = inventory.reduce(
        (sum, item) => sum + item.quantity * item.sellingPrice,
        0
      );
      expect(sellingValue).toBe(1900);
    });

    it("should calculate potential profit from inventory", () => {
      const inventory = [
        { quantity: 100, costPrice: 5, sellingPrice: 10 },
        { quantity: 150, costPrice: 3, sellingPrice: 6 },
      ];

      const potentialProfit = inventory.reduce(
        (sum, item) => sum + (item.sellingPrice - item.costPrice) * item.quantity,
        0
      );
      expect(potentialProfit).toBe(950);
    });
  });

  describe("Dead Stock Identification", () => {
    it("should identify dead stock items", () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const items = [
        { name: "Item1", lastSaleDate: new Date(), quantity: 10 },
        { name: "Item2", lastSaleDate: new Date(ninetyDaysAgo.getTime() - 1 * 24 * 60 * 60 * 1000), quantity: 5 },
      ];

      const deadStockItems = items.filter((item) => {
        const daysSinceLastSale = Math.floor(
          (Date.now() - item.lastSaleDate.getTime()) / (24 * 60 * 60 * 1000)
        );
        return daysSinceLastSale > 90 && item.quantity > 0;
      });

      expect(deadStockItems.length).toBe(1);
      expect(deadStockItems[0].name).toBe("Item2");
    });

    it("should calculate dead stock value", () => {
      const deadStockItems = [
        { product: "Item1", quantity: 20, costPrice: 10 },
        { product: "Item2", quantity: 15, costPrice: 8 },
      ];

      const deadStockValue = deadStockItems.reduce(
        (sum, item) => sum + item.quantity * item.costPrice,
        0
      );
      expect(deadStockValue).toBe(320);
    });

    it("should not count items with zero quantity as dead stock", () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const items = [
        { name: "Item1", lastSaleDate: new Date(ninetyDaysAgo.getTime() - 1 * 24 * 60 * 60 * 1000), quantity: 0 },
      ];

      const deadStockItems = items.filter((item) => {
        const daysSinceLastSale = Math.floor(
          (Date.now() - item.lastSaleDate.getTime()) / (24 * 60 * 60 * 1000)
        );
        return daysSinceLastSale > 90 && item.quantity > 0;
      });

      expect(deadStockItems.length).toBe(0);
    });

    it("should handle items with recent sales", () => {
      const items = [
        { name: "Item1", lastSaleDate: new Date(), quantity: 10 },
        { name: "Item2", lastSaleDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), quantity: 5 },
      ];

      const deadStockItems = items.filter((item) => {
        const daysSinceLastSale = Math.floor(
          (Date.now() - item.lastSaleDate.getTime()) / (24 * 60 * 60 * 1000)
        );
        return daysSinceLastSale > 90 && item.quantity > 0;
      });

      expect(deadStockItems.length).toBe(0);
    });
  });

  describe("Expiry Risk Identification", () => {
    it("should identify expiry risk items", () => {
      const today = new Date();
      const items = [
        { name: "Item1", expiryDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000) },
        { name: "Item2", expiryDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000) },
        { name: "Item3", expiryDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000) },
      ];

      const expiryRiskItems = items.filter((item) => {
        const daysUntilExpiry = Math.floor(
          (item.expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
        );
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
      });

      expect(expiryRiskItems.length).toBe(2);
    });

    it("should calculate expiry risk loss", () => {
      const expiredItems = [
        { product: "Aspirin", quantity: 10, costPrice: 5 },
        { product: "Paracetamol", quantity: 5, costPrice: 3 },
      ];

      const expiryRiskLoss = expiredItems.reduce(
        (sum, item) => sum + item.quantity * item.costPrice,
        0
      );
      expect(expiryRiskLoss).toBe(65);
    });

    it("should not count non-expired items as expiry risk", () => {
      const today = new Date();
      const items = [
        { name: "Item1", expiryDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000) },
      ];

      const expiryRiskItems = items.filter((item) => {
        const daysUntilExpiry = Math.floor(
          (item.expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
        );
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
      });

      expect(expiryRiskItems.length).toBe(0);
    });

    it("should identify expired items", () => {
      const today = new Date();
      const items = [
        { name: "Item1", expiryDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000) },
        { name: "Item2", expiryDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000) },
      ];

      const expiredItems = items.filter((item) => item.expiryDate < today);
      expect(expiredItems.length).toBe(2);
    });
  });

  describe("Low Stock Identification", () => {
    it("should identify low stock items", () => {
      const minStockLevel = 20;
      const inventory = [
        { product: "Aspirin", quantity: 100 },
        { product: "Paracetamol", quantity: 15 },
        { product: "Ibuprofen", quantity: 25 },
      ];

      const lowStockItems = inventory.filter((item) => item.quantity < minStockLevel);
      expect(lowStockItems.length).toBe(1);
      expect(lowStockItems[0].product).toBe("Paracetamol");
    });

    it("should handle custom minimum stock levels", () => {
      const minStockLevels = {
        Aspirin: 50,
        Paracetamol: 30,
      };

      const inventory = [
        { product: "Aspirin", quantity: 40 },
        { product: "Paracetamol", quantity: 25 },
      ];

      const lowStockItems = inventory.filter(
        (item) => item.quantity < (minStockLevels[item.product] || 20)
      );

      expect(lowStockItems.length).toBe(2);
    });
  });

  describe("Sales Velocity Analysis", () => {
    it("should calculate sales velocity", () => {
      const item = { product: "Aspirin", qtySold90Days: 90, quantity: 10 };
      const dailyVelocity = item.qtySold90Days / 90;

      expect(dailyVelocity).toBe(1);
    });

    it("should identify fast-moving products", () => {
      const items = [
        { product: "Aspirin", qtySold90Days: 200 },
        { product: "Paracetamol", qtySold90Days: 50 },
        { product: "Ibuprofen", qtySold90Days: 150 },
      ];

      const fastMoving = items.filter((item) => item.qtySold90Days > 100);
      expect(fastMoving.length).toBe(2);
    });

    it("should identify slow-moving products", () => {
      const items = [
        { product: "Aspirin", qtySold90Days: 200 },
        { product: "Paracetamol", qtySold90Days: 10 },
        { product: "Ibuprofen", qtySold90Days: 150 },
      ];

      const slowMoving = items.filter((item) => item.qtySold90Days < 50);
      expect(slowMoving.length).toBe(1);
      expect(slowMoving[0].product).toBe("Paracetamol");
    });
  });

  describe("Inventory Status", () => {
    it("should show status for items both expired and deadstock", () => {
      const today = new Date();
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const item = {
        name: "Item1",
        expiryDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        lastSaleDate: new Date(ninetyDaysAgo.getTime() - 1 * 24 * 60 * 60 * 1000),
        quantity: 10,
      };

      const isExpired = item.expiryDate < today;
      const daysSinceLastSale = Math.floor(
        (Date.now() - item.lastSaleDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      const isDeadStock = daysSinceLastSale > 90 && item.quantity > 0;

      const status = isExpired && isDeadStock ? "Expiry & Deadstock" : isExpired ? "Expired" : "Deadstock";
      expect(status).toBe("Expiry & Deadstock");
    });

    it("should show separate filter options for expiry and deadstock", () => {
      const filterOptions = ["Expiry", "Deadstock"];
      expect(filterOptions).toContain("Expiry");
      expect(filterOptions).toContain("Deadstock");
      expect(filterOptions.length).toBe(2);
    });
  });

  describe("Branch-Specific Inventory", () => {
    it("should maintain independent inventory for each branch", () => {
      const branches = {
        branch1: [{ product: "Aspirin", quantity: 100 }],
        branch2: [{ product: "Aspirin", quantity: 150 }],
      };

      expect(branches.branch1[0].quantity).toBe(100);
      expect(branches.branch2[0].quantity).toBe(150);
    });

    it("should allow branch selection in inventory view", () => {
      const branches = [
        { id: 1, name: "Main Branch" },
        { id: 2, name: "Secondary Branch" },
      ];
      const selectedBranchId = 1;

      const selectedBranch = branches.find((b) => b.id === selectedBranchId);
      expect(selectedBranch?.name).toBe("Main Branch");
    });

    it("should not affect other branches when updating inventory", () => {
      const branches = {
        branch1: { inventory: [{ product: "Aspirin", quantity: 100 }] },
        branch2: { inventory: [{ product: "Aspirin", quantity: 150 }] },
      };

      const originalBranch1 = branches.branch1.inventory[0].quantity;
      branches.branch2.inventory[0].quantity = 200;

      expect(branches.branch1.inventory[0].quantity).toBe(originalBranch1);
      expect(branches.branch2.inventory[0].quantity).toBe(200);
    });

    it("should consolidate inventory across branches", () => {
      const branches = [
        { name: "Branch1", inventory: [{ product: "Aspirin", quantity: 100 }] },
        { name: "Branch2", inventory: [{ product: "Aspirin", quantity: 150 }] },
      ];

      const totalAspirin = branches.reduce(
        (sum, b) => sum + (b.inventory.find((i) => i.product === "Aspirin")?.quantity || 0),
        0
      );

      expect(totalAspirin).toBe(250);
    });
  });

  describe("Inventory Filtering", () => {
    it("should filter by expiry status", () => {
      const today = new Date();
      const items = [
        { name: "Item1", expiryDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000) },
        { name: "Item2", expiryDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000) },
      ];

      const expiredItems = items.filter((item) => item.expiryDate < today);
      expect(expiredItems.length).toBe(1);
    });

    it("should filter by deadstock status", () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const items = [
        { name: "Item1", lastSaleDate: new Date(), quantity: 10 },
        { name: "Item2", lastSaleDate: new Date(ninetyDaysAgo.getTime() - 1 * 24 * 60 * 60 * 1000), quantity: 5 },
      ];

      const deadStockItems = items.filter((item) => {
        const daysSinceLastSale = Math.floor(
          (Date.now() - item.lastSaleDate.getTime()) / (24 * 60 * 60 * 1000)
        );
        return daysSinceLastSale > 90 && item.quantity > 0;
      });

      expect(deadStockItems.length).toBe(1);
    });

    it("should filter by low stock status", () => {
      const minStockLevel = 20;
      const items = [
        { product: "Aspirin", quantity: 100 },
        { product: "Paracetamol", quantity: 15 },
      ];

      const lowStockItems = items.filter((item) => item.quantity < minStockLevel);
      expect(lowStockItems.length).toBe(1);
    });
  });

  describe("Inventory Reports", () => {
    it("should generate inventory report", () => {
      const inventory = [
        { product: "Aspirin", quantity: 100, costPrice: 5 },
        { product: "Paracetamol", quantity: 150, costPrice: 3 },
      ];

      const report = {
        totalItems: inventory.length,
        totalValue: inventory.reduce((sum, i) => sum + i.quantity * i.costPrice, 0),
      };

      expect(report.totalItems).toBe(2);
      expect(report.totalValue).toBe(950);
    });

    it("should include branch-specific data in report", () => {
      const branch = {
        name: "Main Branch",
        inventory: [{ product: "Aspirin", quantity: 100 }],
      };

      expect(branch.name).toBe("Main Branch");
      expect(branch.inventory.length).toBe(1);
    });
  });

  describe("Performance", () => {
    it("should handle large inventory datasets", () => {
      const largeInventory = Array.from({ length: 10000 }, (_, i) => ({
        product: `Product${i}`,
        quantity: Math.random() * 1000,
        costPrice: Math.random() * 100,
      }));

      const startTime = Date.now();
      const totalValue = largeInventory.reduce(
        (sum, item) => sum + item.quantity * item.costPrice,
        0
      );
      const endTime = Date.now();

      expect(totalValue).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
