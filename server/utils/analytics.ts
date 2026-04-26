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
  grossProfit?: number; // Raw profit before overhead deduction
}

export interface AlertData {
  expiryRiskProducts: any[];
  deadStockProducts: any[];
  lowMarginProducts: any[];
}

/**
 * Calculate dashboard metrics from inventory and sales data
 * @param inventory - Array of inventory items
 * @param sales - Array of sales transactions
 * @param previousPeriodSales - Optional sales from previous period for trend calculation
 * @param monthlyOverheadCosts - Optional monthly overhead costs (Rent + Salaries + Electricity + Others)
 * @param durationDays - Number of days to consider for dead stock calculation (default: 60)
 * @param startDate - Optional start date for filtering (if provided, uses exact date range instead of duration)
 * @param endDate - Optional end date for filtering (if provided, uses exact date range instead of duration)
 */
export function calculateDashboardMetrics(
  inventory: Inventory[],
  sales: SalesTransaction[],
  previousPeriodSales?: SalesTransaction[],
  monthlyOverheadCosts?: number,
  durationDays: number = 60,
  startDate?: Date,
  endDate?: Date
): DashboardMetrics {
  const now = new Date();
  
  // If date range is provided, use exact month filtering
  if (startDate && endDate) {
    const monthStart = new Date(startDate);
    const monthEnd = new Date(endDate);
    monthEnd.setHours(23, 59, 59, 999); // Include entire end day
    
    // Filter inventory by createdAt month (only show data uploaded in this month)
    const monthInventory = inventory.filter(item => {
      const createdDate = new Date(item.createdAt);
      return createdDate >= monthStart && createdDate <= monthEnd;
    });
    
    // Current period sales (within the selected month, filtered by createdAt)
    const currentSales = sales.filter(s => {
      const createdDate = new Date(s.createdAt);
      return createdDate >= monthStart && createdDate <= monthEnd;
    });
    const totalRevenue = currentSales.reduce((sum, s) => sum + parseFloat(s.totalSaleValue.toString()), 0);
    let totalProfit = currentSales.reduce((sum, s) => sum + (parseFloat(s.profit?.toString() || '0')), 0);
    const grossProfit = totalProfit; // Store raw profit before overhead deduction
    
    // Deduct full monthly overhead costs from profit if provided
    // This ensures Dashboard shows Net Profit (after overhead deduction)
    if (monthlyOverheadCosts && monthlyOverheadCosts > 0) {
      totalProfit -= monthlyOverheadCosts;
    }
    
    // For month-based view, trends are calculated differently (no previous period)
    // We'll show 0 trend for month view since we're looking at isolated months
    const revenueTrend = 0;
    const profitTrend = 0;
    
    // Expiry risk: products from this month that are expiring within 90 days from today
    const today = new Date();
    const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    const expiryRiskProducts = monthInventory.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      return expiryDate >= today && expiryDate <= ninetyDaysFromNow;
    });
    const expiryRiskLoss = expiryRiskProducts.reduce(
      (sum, item) => sum + parseFloat(item.price.toString()) * item.quantity,
      0
    );
    const expiryRiskTrend = 0;
    
    // Dead stock: products from this month with 0 sales in the selected month
    const recentSalesProducts = new Set(
      currentSales.map(s => s.productName)
    );
    const deadStockProducts = monthInventory.filter(item => 
      !recentSalesProducts.has(item.productName) && item.quantity > 0
    );
    const deadStockValue = deadStockProducts.reduce(
      (sum, item) => sum + parseFloat(item.price.toString()) * item.quantity,
      0
    );
    const deadStockTrend = 0;
    
    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      revenueTrend: Math.round(revenueTrend * 100) / 100,
      estimatedProfit: Math.round(totalProfit * 100) / 100,
      profitTrend: Math.round(profitTrend * 100) / 100,
      expiryRiskLoss: Math.round(expiryRiskLoss * 100) / 100,
      expiryRiskTrend: Math.round(expiryRiskTrend * 100) / 100,
      deadStockValue: Math.round(deadStockValue * 100) / 100,
      deadStockTrend: Math.round(deadStockTrend * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
    };
  }
  
  // Original duration-based logic (fallback)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Current period sales (last 30 days)
  const currentSales = sales.filter(s => new Date(s.saleDate) >= thirtyDaysAgo);
  const totalRevenue = currentSales.reduce((sum, s) => sum + parseFloat(s.totalSaleValue.toString()), 0);
  let totalProfit = currentSales.reduce((sum, s) => sum + (parseFloat(s.profit?.toString() || '0')), 0);
  
  // Deduct full monthly overhead costs from profit if provided
  // This ensures Dashboard shows Net Profit (after overhead deduction)
  if (monthlyOverheadCosts && monthlyOverheadCosts > 0) {
    totalProfit -= monthlyOverheadCosts;
  }

  // Previous period sales (30-60 days ago)
  const previousSales = (previousPeriodSales || sales).filter(
    s => new Date(s.saleDate) >= sixtyDaysAgo && new Date(s.saleDate) < thirtyDaysAgo
  );
  const previousRevenue = previousSales.reduce((sum, s) => sum + parseFloat(s.totalSaleValue.toString()), 0);
  const previousProfit = previousSales.reduce((sum, s) => sum + (parseFloat(s.profit?.toString() || '0')), 0);

  // Calculate trends
  const revenueTrend = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const profitTrend = previousProfit > 0 ? ((totalProfit - previousProfit) / previousProfit) * 100 : 0;

  // Expiry risk: products expiring within 90 days (from now until 90 days in future)
  const expiryRiskProducts = inventory.filter(item => {
    if (!item.expiryDate) return false;
    const expiryDate = new Date(item.expiryDate);
    return expiryDate >= now && expiryDate <= ninetyDaysFromNow;
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

  // Dead stock: products with 0 sales in last N days (configurable)
  // Calculate by finding products that have no sales in the duration period
  const durationDaysAgo = new Date(now.getTime() - durationDays * 24 * 60 * 60 * 1000);
  
  // Get all product names that have sales in the duration period
  const recentSalesProducts = new Set(
    sales
      .filter(s => new Date(s.saleDate) >= durationDaysAgo)
      .map(s => s.productName)
  );
  
  // Dead stock = products in inventory that have NO sales in the duration period
  const deadStockProducts = inventory.filter(item => 
    !recentSalesProducts.has(item.productName) && item.quantity > 0
  );
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

export function identifyAlerts(
  inventory: Inventory[],
  sales: SalesTransaction[],
  durationDays: number = 60,
  startDate?: Date,
  endDate?: Date
): AlertData {
  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  
  // If date range is provided, use exact month filtering for alerts
  if (startDate && endDate) {
    const monthStart = new Date(startDate);
    const monthEnd = new Date(endDate);
    monthEnd.setHours(23, 59, 59, 999);
    
    // Filter inventory by createdAt month (only show data uploaded in this month)
    const monthInventory = inventory.filter(item => {
      const createdDate = new Date(item.createdAt);
      return createdDate >= monthStart && createdDate <= monthEnd;
    });
    
    // Expiry risk: products from this month that are expiring within 90 days from today
    const today = new Date();
    const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    const expiryRiskProducts = monthInventory.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      return expiryDate >= today && expiryDate <= ninetyDaysFromNow;
    });
    
    // Dead stock: products with 0 sales in the selected month
    const currentSales = sales.filter(s => {
      const createdDate = new Date(s.createdAt);
      return createdDate >= monthStart && createdDate <= monthEnd;
    });
    const recentSalesProducts = new Set(currentSales.map(s => s.productName));
    const deadStockProducts = monthInventory.filter(item => 
      !recentSalesProducts.has(item.productName) && item.quantity > 0
    );
    
    // Low margin products (margin < 20%)
    const lowMarginProducts = monthInventory.filter(item => {
      const costPrice = parseFloat(item.costPrice?.toString() || '0');
      const sellingPrice = parseFloat(item.price.toString());
      if (costPrice === 0) return false;
      const margin = ((sellingPrice - costPrice) / costPrice) * 100;
      return margin < 20;
    });
    
    return {
      expiryRiskProducts,
      deadStockProducts,
      lowMarginProducts,
    };
  }
  
  // Original duration-based logic (fallback)
  const durationDaysAgo = new Date(now.getTime() - durationDays * 24 * 60 * 60 * 1000);

  // Expiry risk: products expiring within 90 days
  const expiryRiskProducts = inventory.filter(item => {
    if (!item.expiryDate) return false;
    const expiryDate = new Date(item.expiryDate);
    return expiryDate >= now && expiryDate <= ninetyDaysFromNow;
  });

  // Dead stock: products with 0 sales in last N days
  const recentSalesProducts = new Set(
    sales
      .filter(s => new Date(s.saleDate) >= durationDaysAgo)
      .map(s => s.productName)
  );
  const deadStockProducts = inventory.filter(item => 
    !recentSalesProducts.has(item.productName) && item.quantity > 0
  );

  // Low margin products (margin < 20%)
  const lowMarginProducts = inventory.filter(item => {
    const costPrice = parseFloat(item.costPrice?.toString() || '0');
    const sellingPrice = parseFloat(item.price.toString());
    if (costPrice === 0) return false;
    const margin = ((sellingPrice - costPrice) / costPrice) * 100;
    return margin < 20;
  });

  return {
    expiryRiskProducts,
    deadStockProducts,
    lowMarginProducts,
  };
}

export function getTopProfitableProducts(inventory: Inventory[]): any[] {
  return inventory
    .map(item => ({
      productName: item.productName,
      costPrice: item.costPrice,
      profit: (parseFloat(item.price.toString()) - parseFloat(item.costPrice?.toString() || '0')) * item.quantity,
      margin: ((parseFloat(item.price.toString()) - parseFloat(item.costPrice?.toString() || '0')) / parseFloat(item.costPrice?.toString() || '1')) * 100,
      quantity: item.quantity,
      price: item.price,
      totalProfit: (parseFloat(item.price.toString()) - parseFloat(item.costPrice?.toString() || '0')) * item.quantity,
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);
}

export function getRevenueProfitTrend(sales: SalesTransaction[]): any[] {
  const trendMap = new Map<string, { revenue: number; profit: number }>();

  sales.forEach(sale => {
    const date = new Date(sale.saleDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (!trendMap.has(key)) {
      trendMap.set(key, { revenue: 0, profit: 0 });
    }

    const current = trendMap.get(key)!;
    current.revenue += parseFloat(sale.totalSaleValue.toString());
    current.profit += parseFloat(sale.profit?.toString() || '0');
  });

  return Array.from(trendMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      profit: Math.round(data.profit * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
