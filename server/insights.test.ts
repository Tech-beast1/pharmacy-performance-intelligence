import { describe, it, expect } from 'vitest';
import { generateKeyInsights } from './utils/insights';
import { DashboardMetrics, AlertData } from './utils/analytics';

describe('Key Insights Generation', () => {
  describe('Profitability Insights', () => {
    it('should generate low profit margin alert when margin < 10%', () => {
      const metrics: DashboardMetrics = {
        totalRevenue: 1000,
        revenueTrend: 0,
        estimatedProfit: 50,
        profitTrend: 0,
        expiryRiskLoss: 0,
        expiryRiskTrend: 0,
        deadStockValue: 0,
        deadStockTrend: 0,
      };

      const alerts: AlertData = {
        expiryRiskProducts: [],
        deadStockProducts: [],
        lowMarginProducts: [],
      };

      const insights = generateKeyInsights(metrics, alerts, [], []);
      const profitabilityInsight = insights.find(i => i.category === 'Profitability');

      expect(profitabilityInsight).toBeDefined();
      expect(profitabilityInsight?.title).toBe('Low Profit Margin Alert');
      expect(profitabilityInsight?.priority).toBe('high');
    });

    it('should generate strong profitability insight when margin > 30%', () => {
      const metrics: DashboardMetrics = {
        totalRevenue: 1000,
        revenueTrend: 0,
        estimatedProfit: 400,
        profitTrend: 0,
        expiryRiskLoss: 0,
        expiryRiskTrend: 0,
        deadStockValue: 0,
        deadStockTrend: 0,
      };

      const alerts: AlertData = {
        expiryRiskProducts: [],
        deadStockProducts: [],
        lowMarginProducts: [],
      };

      const insights = generateKeyInsights(metrics, alerts, [], []);
      const profitabilityInsight = insights.find(i => i.category === 'Profitability');

      expect(profitabilityInsight).toBeDefined();
      expect(profitabilityInsight?.title).toBe('Strong Profitability');
      expect(profitabilityInsight?.priority).toBe('low');
    });
  });

  describe('Expiry Risk Insights', () => {
    it('should generate critical expiry risk alert when > 5% of revenue', () => {
      const metrics: DashboardMetrics = {
        totalRevenue: 1000,
        revenueTrend: 0,
        estimatedProfit: 300,
        profitTrend: 0,
        expiryRiskLoss: 100,
        expiryRiskTrend: 0,
        deadStockValue: 0,
        deadStockTrend: 0,
      };

      const alerts: AlertData = {
        expiryRiskProducts: [],
        deadStockProducts: [],
        lowMarginProducts: [],
      };

      const insights = generateKeyInsights(metrics, alerts, [], []);
      const expiryInsight = insights.find(i => i.category === 'Expiry Risk');

      expect(expiryInsight).toBeDefined();
      expect(expiryInsight?.title).toBe('Critical Expiry Risk');
      expect(expiryInsight?.priority).toBe('high');
    });

    it('should generate no expiry risk insight when no products expiring', () => {
      const metrics: DashboardMetrics = {
        totalRevenue: 1000,
        revenueTrend: 0,
        estimatedProfit: 300,
        profitTrend: 0,
        expiryRiskLoss: 0,
        expiryRiskTrend: 0,
        deadStockValue: 0,
        deadStockTrend: 0,
      };

      const alerts: AlertData = {
        expiryRiskProducts: [],
        deadStockProducts: [],
        lowMarginProducts: [],
      };

      const insights = generateKeyInsights(metrics, alerts, [], []);
      const expiryInsight = insights.find(i => i.category === 'Expiry Risk');

      expect(expiryInsight).toBeDefined();
      expect(expiryInsight?.title).toBe('No Immediate Expiry Risk');
      expect(expiryInsight?.priority).toBe('low');
    });
  });

  describe('Sales Performance Insights', () => {
    it('should generate excellent growth insight when revenue up > 20%', () => {
      const metrics: DashboardMetrics = {
        totalRevenue: 1000,
        revenueTrend: 25,
        estimatedProfit: 300,
        profitTrend: 0,
        expiryRiskLoss: 0,
        expiryRiskTrend: 0,
        deadStockValue: 0,
        deadStockTrend: 0,
      };

      const alerts: AlertData = {
        expiryRiskProducts: [],
        deadStockProducts: [],
        lowMarginProducts: [],
      };

      const insights = generateKeyInsights(metrics, alerts, [], []);
      const salesInsight = insights.find(i => i.category === 'Sales Performance');

      expect(salesInsight).toBeDefined();
      expect(salesInsight?.title).toBe('Excellent Sales Growth');
      expect(salesInsight?.priority).toBe('low');
    });

    it('should generate sales decline alert when revenue down > 20%', () => {
      const metrics: DashboardMetrics = {
        totalRevenue: 1000,
        revenueTrend: -25,
        estimatedProfit: 300,
        profitTrend: 0,
        expiryRiskLoss: 0,
        expiryRiskTrend: 0,
        deadStockValue: 0,
        deadStockTrend: 0,
      };

      const alerts: AlertData = {
        expiryRiskProducts: [],
        deadStockProducts: [],
        lowMarginProducts: [],
      };

      const insights = generateKeyInsights(metrics, alerts, [], []);
      const salesInsight = insights.find(i => i.category === 'Sales Performance');

      expect(salesInsight).toBeDefined();
      expect(salesInsight?.title).toBe('Significant Sales Decline');
      expect(salesInsight?.priority).toBe('high');
    });
  });

  describe('All Five Insight Categories', () => {
    it('should generate exactly 5 insights (one for each category)', () => {
      const metrics: DashboardMetrics = {
        totalRevenue: 1000,
        revenueTrend: 5,
        estimatedProfit: 300,
        profitTrend: 0,
        expiryRiskLoss: 0,
        expiryRiskTrend: 0,
        deadStockValue: 0,
        deadStockTrend: 0,
      };

      const alerts: AlertData = {
        expiryRiskProducts: [],
        deadStockProducts: [],
        lowMarginProducts: [],
      };

      const insights = generateKeyInsights(metrics, alerts, [], []);

      expect(insights.length).toBe(5);
      const categories = insights.map(i => i.category).sort();
      expect(categories).toEqual([
        'Expiry Risk',
        'Inventory',
        'Pricing',
        'Profitability',
        'Sales Performance',
      ]);
    });

    it('should sort insights by priority (high first)', () => {
      const metrics: DashboardMetrics = {
        totalRevenue: 1000,
        revenueTrend: 5,
        estimatedProfit: 50,
        profitTrend: 0,
        expiryRiskLoss: 100,
        expiryRiskTrend: 0,
        deadStockValue: 0,
        deadStockTrend: 0,
      };

      const alerts: AlertData = {
        expiryRiskProducts: [],
        deadStockProducts: [],
        lowMarginProducts: [],
      };

      const insights = generateKeyInsights(metrics, alerts, [], []);

      // First insight should be high priority
      expect(insights[0].priority).toBe('high');
    });
  });
});
