import type { Inventory, SalesTransaction } from '../../drizzle/schema';

export interface DashboardMetrics {
  totalRevenue: number;
  revenueTrend: number;
  estimatedProfit: number;
  profitTrend: number;
  expiryRiskLoss: number;
  expiryRiskTrend: number;
  deadStockValue: number;
  deadStockTrend: number;
}

export interface AlertData {
  expiryRiskProducts: any[];
  deadStockProducts: any[];
  lowMarginProducts: any[];
}

/**
 * Calculate dashboard metrics from inventory and sales data
 */
export function calculateDashboardMetrics(
  inventory: Inventory[],
  sales: SalesTransaction[],
  previousPeriodSales?: SalesTransaction[]
): DashboardMetrics {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Current period sales (last 30 days)
  const currentSales = sales.filter(s => new Date(s.saleDate) >= thirtyDaysAgo);
  const totalRevenue = currentSales.reduce((sum, s) => sum + parseFloat(s.totalSaleValue.toString()), 0);
  const totalProfit = currentSales.reduce((sum, s) => sum + (parseFloat(s.profit?.toString() || '0')), 0);

  // Previous period sales (30-60 days ago)
  const previousSales = (previousPeriodSales || sales).filter(
    s => new Date(s.saleDate) >= sixtyDaysAgo && new Date(s.saleDate) < thirtyDaysAgo
  );
  const previousRevenue = previousSales.reduce((sum, s) => sum + parseFloat(s.totalSaleValue.toString()), 0);
  const previousProfit = previousSales.reduce((sum, s) => sum + (parseFloat(s.profit?.toString() || '0')), 0);

  // Calculate trends
  const revenueTrend = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const profitTrend = previousProfit > 0 ? ((totalProfit - previousProfit) / previousProfit) * 100 : 0;

  // Expiry risk: products expiring within 90 days
  const expiryRiskProducts = inventory.filter(item => {
    if (!item.expiryDate) return false;
    const expiryDate = new Date(item.expiryDate);
    return expiryDate >= now && expiryDate <= ninetyDaysAgo;
  });
  const expiryRiskLoss = expiryRiskProducts.reduce(
    (sum, item) => sum + parseFloat(item.price.toString()) * item.quantity,
    0
  );

  // Previous expiry risk (for trend)
  const previousExpiryRiskLoss = expiryRiskProducts.reduce(
    (sum, item) => sum + parseFloat(item.price.toString()) * Math.max(0, item.quantity - 1),
    0
  );
  const expiryRiskTrend = previousExpiryRiskLoss > 0 
    ? ((expiryRiskLoss - previousExpiryRiskLoss) / previousExpiryRiskLoss) * 100 
    : 0;

  // Dead stock: products with 0 sales in last 60 days
  const deadStockProducts = inventory.filter(item => {
    const lastSale = new Date(item.lastSaleDate || 0);
    return lastSale < sixtyDaysAgo;
  });
  const deadStockValue = deadStockProducts.reduce(
    (sum, item) => sum + parseFloat(item.price.toString()) * item.quantity,
    0
  );

  // Previous dead stock value (approximate)
  const previousDeadStockValue = deadStockProducts.reduce(
    (sum, item) => sum + parseFloat(item.price.toString()) * Math.max(0, item.quantity - 1),
    0
  );
  const deadStockTrend = previousDeadStockValue > 0 
    ? ((deadStockValue - previousDeadStockValue) / previousDeadStockValue) * 100 
    : 0;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    revenueTrend: Math.round(revenueTrend * 100) / 100,
    estimatedProfit: Math.round(totalProfit * 100) / 100,
    profitTrend: Math.round(profitTrend * 100) / 100,
    expiryRiskLoss: Math.round(expiryRiskLoss * 100) / 100,
    expiryRiskTrend: Math.round(expiryRiskTrend * 100) / 100,
    deadStockValue: Math.round(deadStockValue * 100) / 100,
    deadStockTrend: Math.round(deadStockTrend * 100) / 100,
  };
}

/**
 * Identify alert products
 */
export function identifyAlerts(
  inventory: Inventory[],
  sales: SalesTransaction[]
): AlertData {
  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Expiry risk: products expiring within 90 days
  const expiryRiskProducts = inventory
    .filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      return expiryDate >= now && expiryDate <= ninetyDaysAgo;
    })
    .map(item => ({
      ...item,
      daysToExpiry: Math.ceil(
        (new Date(item.expiryDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
      riskValue: parseFloat(item.price.toString()) * item.quantity,
    }));

  // Dead stock: products with 0 sales in last 60 days
  const deadStockProducts = inventory
    .filter(item => {
      const lastSale = new Date(item.lastSaleDate || 0);
      return lastSale < sixtyDaysAgo;
    })
    .map(item => ({
      ...item,
      daysSinceLastSale: Math.ceil(
        (now.getTime() - new Date(item.lastSaleDate || now).getTime()) / (1000 * 60 * 60 * 24)
      ),
      stockValue: parseFloat(item.price.toString()) * item.quantity,
    }));

  // Low margin products: margin < 20%
  const lowMarginProducts = inventory
    .filter(item => {
      const costPrice = parseFloat(item.costPrice?.toString() || '0');
      const salePrice = parseFloat(item.price.toString());
      if (costPrice === 0) return false;
      const margin = ((salePrice - costPrice) / costPrice) * 100;
      return margin < 20;
    })
    .map(item => ({
      ...item,
      margin: calculateMargin(item),
      profitValue: parseFloat(item.totalSalesValue.toString()),
    }));

  return {
    expiryRiskProducts,
    deadStockProducts,
    lowMarginProducts,
  };
}

/**
 * Calculate profit margin for a product
 */
export function calculateMargin(item: Inventory): number {
  const costPrice = parseFloat(item.costPrice?.toString() || '0');
  const salePrice = parseFloat(item.price.toString());
  if (costPrice === 0) return 0;
  return Math.round(((salePrice - costPrice) / costPrice) * 100);
}

/**
 * Generate top 10 profitable products
 */
export function getTopProfitableProducts(inventory: Inventory[]): any[] {
  return inventory
    .map(item => ({
      ...item,
      margin: calculateMargin(item),
      totalProfit: parseFloat(item.totalSalesValue.toString()) * (calculateMargin(item) / 100),
    }))
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 10);
}

/**
 * Generate revenue vs profit trend data
 */
export function getRevenueProfitTrend(sales: SalesTransaction[]): any[] {
  const trendData: { [key: string]: { revenue: number; profit: number } } = {};

  sales.forEach(sale => {
    const date = new Date(sale.saleDate);
    const dateKey = date.toISOString().split('T')[0];

    if (!trendData[dateKey]) {
      trendData[dateKey] = { revenue: 0, profit: 0 };
    }

    trendData[dateKey].revenue += parseFloat(sale.totalSaleValue.toString());
    trendData[dateKey].profit += parseFloat(sale.profit?.toString() || '0');
  });

  return Object.entries(trendData)
    .map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      profit: Math.round(data.profit * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
