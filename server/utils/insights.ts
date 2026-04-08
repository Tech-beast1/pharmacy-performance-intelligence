import { DashboardMetrics, AlertData } from './analytics';
import { Inventory, SalesTransaction } from '../../drizzle/schema';

export interface KeyInsight {
  category: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Generate key insights based on dashboard metrics and data
 */
export function generateKeyInsights(
  metrics: DashboardMetrics,
  alerts: AlertData,
  inventory: Inventory[],
  sales: SalesTransaction[]
): KeyInsight[] {
  const insights: KeyInsight[] = [];

  // 1. PROFITABILITY INSIGHTS
  const profitMargin = metrics.totalRevenue > 0 ? (metrics.estimatedProfit / metrics.totalRevenue) * 100 : 0;
  
  if (profitMargin < 10) {
    insights.push({
      category: 'Profitability',
      title: 'Low Profit Margin Alert',
      description: `Your profit margin is ${profitMargin.toFixed(1)}%. Consider reviewing pricing strategy or reducing operational costs.`,
      icon: 'TrendingDown',
      color: 'red',
      priority: 'high'
    });
  } else if (profitMargin > 30) {
    insights.push({
      category: 'Profitability',
      title: 'Strong Profitability',
      description: `Excellent profit margin of ${profitMargin.toFixed(1)}%. Your business is performing well.`,
      icon: 'TrendingUp',
      color: 'green',
      priority: 'low'
    });
  } else {
    insights.push({
      category: 'Profitability',
      title: 'Healthy Profit Margin',
      description: `Your profit margin is ${profitMargin.toFixed(1)}%. This is a healthy range for pharmacy operations.`,
      icon: 'BarChart3',
      color: 'blue',
      priority: 'low'
    });
  }

  // 2. INVENTORY INSIGHTS
  const totalInventoryValue = inventory.reduce((sum, item) => sum + (parseFloat(item.price.toString()) * item.quantity), 0);
  const deadStockPercentage = totalInventoryValue > 0 ? (metrics.deadStockValue / totalInventoryValue) * 100 : 0;

  if (deadStockPercentage > 20) {
    insights.push({
      category: 'Inventory',
      title: 'High Dead Stock Warning',
      description: `${deadStockPercentage.toFixed(1)}% of inventory (₵${metrics.deadStockValue.toLocaleString()}) is not moving. Consider clearance sales or donations.`,
      icon: 'Package',
      color: 'red',
      priority: 'high'
    });
  } else if (deadStockPercentage > 10) {
    insights.push({
      category: 'Inventory',
      title: 'Moderate Dead Stock',
      description: `${deadStockPercentage.toFixed(1)}% of inventory (₵${metrics.deadStockValue.toLocaleString()}) hasn't sold recently. Monitor closely.`,
      icon: 'Package',
      color: 'orange',
      priority: 'medium'
    });
  } else {
    insights.push({
      category: 'Inventory',
      title: 'Healthy Inventory Turnover',
      description: `Only ${deadStockPercentage.toFixed(1)}% dead stock. Your inventory is moving well.`,
      icon: 'Package',
      color: 'green',
      priority: 'low'
    });
  }

  // 3. EXPIRY RISK INSIGHTS
  const expiryRiskPercentage = metrics.totalRevenue > 0 ? (metrics.expiryRiskLoss / metrics.totalRevenue) * 100 : 0;

  if (metrics.expiryRiskLoss > 0) {
    if (expiryRiskPercentage > 5) {
      insights.push({
        category: 'Expiry Risk',
        title: 'Critical Expiry Risk',
        description: `₵${metrics.expiryRiskLoss.toLocaleString()} worth of products expiring within 90 days (${expiryRiskPercentage.toFixed(1)}% of revenue). Urgent action needed.`,
        icon: 'AlertTriangle',
        color: 'red',
        priority: 'high'
      });
    } else {
      insights.push({
        category: 'Expiry Risk',
        title: 'Monitor Expiry Dates',
        description: `₵${metrics.expiryRiskLoss.toLocaleString()} worth of products expiring within 90 days. Plan promotions to move stock.`,
        icon: 'AlertTriangle',
        color: 'orange',
        priority: 'medium'
      });
    }
  } else {
    insights.push({
      category: 'Expiry Risk',
      title: 'No Immediate Expiry Risk',
      description: 'No products expiring within 90 days. Your expiry management is on track.',
      icon: 'CheckCircle',
      color: 'green',
      priority: 'low'
    });
  }

  // 4. PRICING INSIGHTS
  const lowMarginCount = alerts.lowMarginProducts?.length || 0;
  const lowMarginRevenue = alerts.lowMarginProducts?.reduce((sum, p) => sum + parseFloat(p.totalRevenue?.toString() || '0'), 0) || 0;
  const lowMarginPercentage = metrics.totalRevenue > 0 ? (lowMarginRevenue / metrics.totalRevenue) * 100 : 0;

  if (lowMarginPercentage > 30) {
    insights.push({
      category: 'Pricing',
      title: 'Review Pricing Strategy',
      description: `${lowMarginCount} products with low margins account for ${lowMarginPercentage.toFixed(1)}% of revenue. Consider price adjustments.`,
      icon: 'DollarSign',
      color: 'red',
      priority: 'high'
    });
  } else if (lowMarginPercentage > 15) {
    insights.push({
      category: 'Pricing',
      title: 'Optimize Pricing',
      description: `${lowMarginCount} low-margin products contribute ${lowMarginPercentage.toFixed(1)}% of revenue. Review pricing for these items.`,
      icon: 'DollarSign',
      color: 'orange',
      priority: 'medium'
    });
  } else {
    insights.push({
      category: 'Pricing',
      title: 'Healthy Pricing Mix',
      description: `Your pricing strategy is balanced. Low-margin products are only ${lowMarginPercentage.toFixed(1)}% of revenue.`,
      icon: 'DollarSign',
      color: 'green',
      priority: 'low'
    });
  }

  // 5. SALES PERFORMANCE INSIGHTS
  const revenueTrendPercentage = metrics.revenueTrend;

  if (revenueTrendPercentage > 20) {
    insights.push({
      category: 'Sales Performance',
      title: 'Excellent Sales Growth',
      description: `Revenue is up ${revenueTrendPercentage.toFixed(1)}% compared to last period. Maintain this momentum!`,
      icon: 'TrendingUp',
      color: 'green',
      priority: 'low'
    });
  } else if (revenueTrendPercentage > 0) {
    insights.push({
      category: 'Sales Performance',
      title: 'Positive Sales Trend',
      description: `Revenue increased by ${revenueTrendPercentage.toFixed(1)}% compared to last period. Good progress.`,
      icon: 'TrendingUp',
      color: 'blue',
      priority: 'low'
    });
  } else if (revenueTrendPercentage < -20) {
    insights.push({
      category: 'Sales Performance',
      title: 'Significant Sales Decline',
      description: `Revenue dropped ${Math.abs(revenueTrendPercentage).toFixed(1)}% compared to last period. Investigate causes and take corrective action.`,
      icon: 'TrendingDown',
      color: 'red',
      priority: 'high'
    });
  } else if (revenueTrendPercentage < 0) {
    insights.push({
      category: 'Sales Performance',
      title: 'Sales Declining',
      description: `Revenue decreased by ${Math.abs(revenueTrendPercentage).toFixed(1)}% compared to last period. Monitor closely.`,
      icon: 'TrendingDown',
      color: 'orange',
      priority: 'medium'
    });
  } else {
    insights.push({
      category: 'Sales Performance',
      title: 'Stable Sales',
      description: 'Revenue is stable compared to last period. Maintain current strategies.',
      icon: 'BarChart3',
      color: 'blue',
      priority: 'low'
    });
  }

  // Sort by priority (high first, then medium, then low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights;
}
