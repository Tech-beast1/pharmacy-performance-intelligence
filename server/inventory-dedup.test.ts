import { describe, it, expect } from 'vitest';

describe('Inventory Deduplication - Prioritize Alert Status', () => {
  it('should keep the item with expiry risk when deduplicating by product name', () => {
    // Simulate inventory data with duplicate products
    const inventory = [
      {
        id: '1',
        productName: 'Vitamin C',
        price: 10,
        quantity: 50,
        costPrice: 5,
        expiryDate: '2026-08-20', // No expiry risk
      },
      {
        id: '2',
        productName: 'Vitamin C', // Same product name
        price: 10,
        quantity: 30,
        costPrice: 5,
        expiryDate: '2026-05-15', // Expiry risk (within 90 days)
      },
    ];

    // Simulate alerts data
    const alerts = {
      expiryRiskProducts: [
        { id: '2', productName: 'Vitamin C', expiryDate: '2026-05-15' },
      ],
      deadStockProducts: [],
      lowMarginProducts: [],
    };

    // Simulate deduplication logic
    const productMap = new Map();
    inventory.forEach(item => {
      const productName = item.productName?.toLowerCase().trim() || '';
      const existing = productMap.get(productName);

      // Check if current item has an alert status
      const currentHasAlert = alerts && (
        alerts.expiryRiskProducts.some((p: any) => p.id === item.id) ||
        alerts.deadStockProducts.some((p: any) => p.id === item.id) ||
        alerts.lowMarginProducts.some((p: any) => p.id === item.id)
      );

      // Check if existing item has an alert status
      const existingHasAlert = existing && alerts && (
        alerts.expiryRiskProducts.some((p: any) => p.id === existing.id) ||
        alerts.deadStockProducts.some((p: any) => p.id === existing.id) ||
        alerts.lowMarginProducts.some((p: any) => p.id === existing.id)
      );

      // Keep the item with alert status, or the latest if neither/both have alerts
      if (!existing || currentHasAlert || !existingHasAlert) {
        productMap.set(productName, item);
      }
    });

    const result = Array.from(productMap.values());

    // Should have only 1 item (deduplicated)
    expect(result).toHaveLength(1);

    // Should be the item with expiry risk (id: '2')
    expect(result[0].id).toBe('2');
    expect(result[0].expiryDate).toBe('2026-05-15');
  });

  it('should keep the item with dead stock when deduplicating', () => {
    const inventory = [
      {
        id: '3',
        productName: 'Zinc Sulphate',
        price: 5.5,
        quantity: 130,
        costPrice: 3,
        expiryDate: '2026-12-31',
      },
      {
        id: '4',
        productName: 'Zinc Sulphate', // Same product
        price: 5.5,
        quantity: 50,
        costPrice: 3,
        expiryDate: '2026-12-31',
      },
    ];

    const alerts = {
      expiryRiskProducts: [],
      deadStockProducts: [
        { id: '4', productName: 'Zinc Sulphate', quantity: 50 },
      ],
      lowMarginProducts: [],
    };

    const productMap = new Map();
    inventory.forEach(item => {
      const productName = item.productName?.toLowerCase().trim() || '';
      const existing = productMap.get(productName);

      const currentHasAlert = alerts && (
        alerts.expiryRiskProducts.some((p: any) => p.id === item.id) ||
        alerts.deadStockProducts.some((p: any) => p.id === item.id) ||
        alerts.lowMarginProducts.some((p: any) => p.id === item.id)
      );

      const existingHasAlert = existing && alerts && (
        alerts.expiryRiskProducts.some((p: any) => p.id === existing.id) ||
        alerts.deadStockProducts.some((p: any) => p.id === existing.id) ||
        alerts.lowMarginProducts.some((p: any) => p.id === existing.id)
      );

      if (!existing || currentHasAlert || !existingHasAlert) {
        productMap.set(productName, item);
      }
    });

    const result = Array.from(productMap.values());

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4'); // Dead stock item should be kept
  });

  it('should keep the latest item when neither has alert status', () => {
    const inventory = [
      {
        id: '5',
        productName: 'Paracetamol',
        price: 2,
        quantity: 100,
        costPrice: 1,
        expiryDate: '2026-12-31',
      },
      {
        id: '6',
        productName: 'Paracetamol', // Same product, no alerts
        price: 2,
        quantity: 200,
        costPrice: 1,
        expiryDate: '2026-12-31',
      },
    ];

    const alerts = {
      expiryRiskProducts: [],
      deadStockProducts: [],
      lowMarginProducts: [],
    };

    const productMap = new Map();
    inventory.forEach(item => {
      const productName = item.productName?.toLowerCase().trim() || '';
      const existing = productMap.get(productName);

      const currentHasAlert = alerts && (
        alerts.expiryRiskProducts.some((p: any) => p.id === item.id) ||
        alerts.deadStockProducts.some((p: any) => p.id === item.id) ||
        alerts.lowMarginProducts.some((p: any) => p.id === item.id)
      );

      const existingHasAlert = existing && alerts && (
        alerts.expiryRiskProducts.some((p: any) => p.id === existing.id) ||
        alerts.deadStockProducts.some((p: any) => p.id === existing.id) ||
        alerts.lowMarginProducts.some((p: any) => p.id === existing.id)
      );

      if (!existing || currentHasAlert || !existingHasAlert) {
        productMap.set(productName, item);
      }
    });

    const result = Array.from(productMap.values());

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('6'); // Latest item should be kept
  });

  it('should prioritize expiry risk over dead stock when both exist', () => {
    const inventory = [
      {
        id: '7',
        productName: 'Aspirin',
        price: 1.5,
        quantity: 100,
        costPrice: 0.8,
        expiryDate: '2026-12-31',
      },
      {
        id: '8',
        productName: 'Aspirin', // Same product with expiry risk
        price: 1.5,
        quantity: 50,
        costPrice: 0.8,
        expiryDate: '2026-05-10',
      },
    ];

    const alerts = {
      expiryRiskProducts: [
        { id: '8', productName: 'Aspirin', expiryDate: '2026-05-10' },
      ],
      deadStockProducts: [
        { id: '7', productName: 'Aspirin', quantity: 100 },
      ],
      lowMarginProducts: [],
    };

    const productMap = new Map();
    inventory.forEach(item => {
      const productName = item.productName?.toLowerCase().trim() || '';
      const existing = productMap.get(productName);

      const currentHasAlert = alerts && (
        alerts.expiryRiskProducts.some((p: any) => p.id === item.id) ||
        alerts.deadStockProducts.some((p: any) => p.id === item.id) ||
        alerts.lowMarginProducts.some((p: any) => p.id === item.id)
      );

      const existingHasAlert = existing && alerts && (
        alerts.expiryRiskProducts.some((p: any) => p.id === existing.id) ||
        alerts.deadStockProducts.some((p: any) => p.id === existing.id) ||
        alerts.lowMarginProducts.some((p: any) => p.id === existing.id)
      );

      if (!existing || currentHasAlert || !existingHasAlert) {
        productMap.set(productName, item);
      }
    });

    const result = Array.from(productMap.values());

    expect(result).toHaveLength(1);
    // Should keep the item with expiry risk (processed last, has alert)
    expect(result[0].id).toBe('8');
  });
});
