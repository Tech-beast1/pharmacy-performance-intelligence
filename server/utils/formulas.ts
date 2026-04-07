/**
 * Formula calculation engine with human-readable interpretations
 * Provides meaningful insights into pharmacy performance metrics
 */

import type { Inventory, SalesTransaction } from '../../drizzle/schema';

export interface MetricInterpretation {
  value: number;
  formatted: string;
  interpretation: string;
  trend?: string;
  recommendation?: string;
}

/**
 * Calculate Total Revenue
 * Formula: Σ (Selling Price × Quantity Sold)
 */
export function calculateTotalRevenue(salesTransactions: SalesTransaction[]): MetricInterpretation {
  const total = salesTransactions.reduce((sum, transaction) => {
    const salePrice = Number(transaction.salePrice || 0);
    const quantity = Number(transaction.quantitySold || 0);
    return sum + (salePrice * quantity);
  }, 0);

  const value = total;
  const formatted = `₵${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return {
    value,
    formatted,
    interpretation: `Your pharmacy generated ${formatted} in total sales revenue during this period.`,
    recommendation: value > 0 ? 'Monitor top-selling products and maintain their stock levels.' : 'No sales recorded. Check data upload or product availability.',
  };
}

/**
 * Calculate Gross Profit
 * Formula: Σ ((Selling Price – Cost Price) × Quantity Sold)
 */
export function calculateGrossProfit(salesTransactions: SalesTransaction[]): MetricInterpretation {
  const total = salesTransactions.reduce((sum, transaction) => {
    const salePrice = Number(transaction.salePrice || 0);
    const costPrice = Number(transaction.costPrice || 0);
    const quantity = Number(transaction.quantitySold || 0);
    const profit = (salePrice - costPrice) * quantity;
    return sum + profit;
  }, 0);

  const value = total;
  const formatted = `₵${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return {
    value,
    formatted,
    interpretation: `Before operational costs, your pharmacy earned ${formatted} in gross profit. This is your profit margin before paying rent, salaries, and utilities.`,
    recommendation: value > 0 ? 'Review cost prices to identify high-margin products.' : 'Gross profit is negative. Review pricing strategy.',
  };
}

/**
 * Calculate Net Profit
 * Formula: Gross Profit - Overhead Costs
 */
export function calculateNetProfit(
  grossProfit: number,
  overheadCosts: number
): MetricInterpretation {
  const value = grossProfit - overheadCosts;
  const formatted = `₵${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const overheadFormatted = `₵${overheadCosts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return {
    value,
    formatted,
    interpretation: `After deducting ${overheadFormatted} in operational costs (rent, salaries, utilities, etc.), your net profit is ${formatted}. This is what you keep.`,
    recommendation: value > 0 
      ? 'Your business is profitable. Consider reinvesting in inventory or expansion.' 
      : 'Your net profit is negative. Review operational costs or increase sales.',
  };
}

/**
 * Calculate Expiry Risk Loss
 * Formula: Σ (Cost Price × Current Stock) for products expiring within threshold
 */
export function calculateExpiryRiskLoss(
  inventory: Inventory[],
  thresholdDays: number = 60
): MetricInterpretation {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + thresholdDays * 24 * 60 * 60 * 1000);

  const total = inventory.reduce((sum, item) => {
    const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
    
    // Check if product expires within threshold
    if (expiryDate && expiryDate <= thresholdDate && expiryDate > now) {
      const costPrice = Number(item.costPrice || 0);
      const quantity = Number(item.quantity || 0);
      const loss = costPrice * quantity;
      return sum + loss;
    }
    return sum;
  }, 0);

  const value = total;
  const formatted = `₵${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return {
    value,
    formatted,
    interpretation: `You have ${formatted} worth of inventory at risk of expiring within the next ${thresholdDays} days. These products may need to be discounted or disposed of, resulting in potential losses.`,
    recommendation: value > 0 
      ? 'Create promotional campaigns for expiring products to minimize losses.' 
      : 'No expiry risk detected. Good inventory management!',
  };
}

/**
 * Calculate Dead Stock Value
 * Formula: Σ (Cost Price × Current Stock) for products not sold within threshold
 */
export function calculateDeadStockValue(
  inventory: Inventory[],
  thresholdDays: number = 60
): MetricInterpretation {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() - thresholdDays * 24 * 60 * 60 * 1000);

  const total = inventory.reduce((sum, item) => {
    const lastSaleDate = item.lastSaleDate ? new Date(item.lastSaleDate) : null;
    
    // Check if product hasn't been sold within threshold
    if (!lastSaleDate || lastSaleDate < thresholdDate) {
      const costPrice = Number(item.costPrice || 0);
      const quantity = Number(item.quantity || 0);
      const deadValue = costPrice * quantity;
      return sum + deadValue;
    }
    return sum;
  }, 0);

  const value = total;
  const formatted = `₵${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return {
    value,
    formatted,
    interpretation: `You have ${formatted} tied up in products that haven't sold in the last ${thresholdDays} days. This capital could be reinvested in faster-moving inventory or used for other business needs.`,
    recommendation: value > 0 
      ? 'Consider discontinuing slow-moving products or running clearance sales to free up capital.' 
      : 'Excellent inventory turnover! No dead stock detected.',
  };
}

/**
 * Calculate Profit Margin Percentage
 * Formula: (Gross Profit / Total Revenue) × 100
 */
export function calculateProfitMargin(
  totalRevenue: number,
  grossProfit: number
): MetricInterpretation {
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const formatted = `${margin.toFixed(1)}%`;

  return {
    value: margin,
    formatted,
    interpretation: `For every ₵100 in sales, you make ${formatted} in gross profit before operational costs. This is your profit margin.`,
    recommendation: margin > 30 
      ? 'Strong profit margin. Maintain current pricing strategy.' 
      : margin > 15
      ? 'Moderate profit margin. Look for cost reduction opportunities.'
      : 'Low profit margin. Review pricing or reduce costs.',
  };
}

/**
 * Calculate Stock Turnover Rate
 * Formula: Total Quantity Sold / Average Stock
 */
export function calculateStockTurnoverRate(
  totalQuantitySold: number,
  averageStock: number
): MetricInterpretation {
  const turnoverRate = averageStock > 0 ? totalQuantitySold / averageStock : 0;
  const formatted = `${turnoverRate.toFixed(2)}x`;

  return {
    value: turnoverRate,
    formatted,
    interpretation: `Your inventory turns over ${formatted} times during this period. This means you sell and replace your average stock ${turnoverRate.toFixed(2)} times.`,
    recommendation: turnoverRate > 4 
      ? 'Excellent turnover. Products are selling quickly.' 
      : turnoverRate > 2
      ? 'Good turnover rate. Monitor for seasonal changes.'
      : 'Slow turnover. Consider reviewing product mix or pricing.',
  };
}

/**
 * Generate comprehensive performance summary
 */
export function generatePerformanceSummary(
  totalRevenue: MetricInterpretation,
  grossProfit: MetricInterpretation,
  netProfit: MetricInterpretation,
  expiryRisk: MetricInterpretation,
  deadStock: MetricInterpretation,
  profitMargin: MetricInterpretation
): string {
  return `
## Pharmacy Performance Summary

### Revenue & Profitability
- **Total Revenue**: ${totalRevenue.formatted}
  ${totalRevenue.interpretation}

- **Gross Profit**: ${grossProfit.formatted}
  ${grossProfit.interpretation}

- **Net Profit**: ${netProfit.formatted}
  ${netProfit.interpretation}

- **Profit Margin**: ${profitMargin.formatted}
  ${profitMargin.interpretation}

### Inventory Health
- **Expiry Risk Loss**: ${expiryRisk.formatted}
  ${expiryRisk.interpretation}

- **Dead Stock Value**: ${deadStock.formatted}
  ${deadStock.interpretation}

### Recommendations
${[totalRevenue, grossProfit, netProfit, expiryRisk, deadStock, profitMargin]
  .map(m => m.recommendation)
  .filter(Boolean)
  .map(r => `- ${r}`)
  .join('\n')}
  `.trim();
}
