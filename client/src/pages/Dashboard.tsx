import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Package, Loader2, Trash2, TrendingDown, BarChart3, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DownloadReport from '@/components/DownloadReport';
import PageHeader from '@/components/PageHeader';
import PharmacySelector from '@/components/PharmacySelector';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface MetricCard {
  title: string;
  value: string;
  trend: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export default function Dashboard() {
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [durationDays, setDurationDays] = useState<number>(60);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>(() => {
    try {
      return localStorage.getItem('pharmacyName') || '';
    } catch {
      return '';
    }
  });

  // Save pharmacy name to localStorage whenever it changes
  useEffect(() => {
    try {
      if (selectedPharmacy) {
        localStorage.setItem('pharmacyName', selectedPharmacy);
      }
    } catch (error) {
      console.error('Failed to save pharmacy name to localStorage:', error);
    }
  }, [selectedPharmacy]);
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
    return lastDay;
  });

  const clearAllMutation = trpc.data.clearAll.useMutation();
  const saveMetricsMutation = trpc.monthlyMetrics.save.useMutation();

  const handleSaveMetrics = async () => {
    if (!metrics) return;
    
    const [year, month] = startDate.substring(0, 7).split('-');
    try {
      await saveMetricsMutation.mutateAsync({
        month: parseInt(month),
        year: parseInt(year),
        totalRevenue: metrics.totalRevenue,
        estimatedProfit: metrics.estimatedProfit,
        expiryRiskLoss: metrics.expiryRiskLoss,
        deadStockValue: metrics.deadStockValue,
      });
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      alert(`✓ Metrics for ${monthName} saved successfully!`);
    } catch (error) {
      console.error('Error saving metrics:', error);
      alert('✗ Failed to save metrics. Please try again.');
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      const [year, month] = startDate.substring(0, 7).split('-');
      await clearAllMutation.mutateAsync({ month: parseInt(month), year: parseInt(year) });
      setShowClearConfirm(false);
      // Invalidate all queries to refresh the dashboard
      await trpc.useUtils().analytics.invalidate();
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setIsClearing(false);
    }
  };


  // Fetch dashboard data
  const metricsQuery = trpc.analytics.getDashboardMetrics.useQuery({ 
    startDate, 
    endDate,
    durationDays 
  });
  const alertsQuery = trpc.analytics.getAlerts.useQuery({ 
    startDate, 
    endDate,
    durationDays 
  });
  const topProductsQuery = trpc.analytics.getTopProducts.useQuery();
  const revenueTrendQuery = trpc.analytics.getRevenueTrend.useQuery();
  const insightsQuery = trpc.analytics.getKeyInsights.useQuery();

  const metrics = metricsQuery.data?.data;
  const previousMetrics = metricsQuery.data?.previousMetrics;
  const alerts = alertsQuery.data?.data;
  const topProducts = topProductsQuery.data?.data || [];
  const revenueTrend = revenueTrendQuery.data?.data || [];
  const insights = insightsQuery.data?.data || [];
  
  // Calculate percentage changes for month-over-month comparison
  const calculatePercentageChange = (current: number, previous: number | null | undefined): number => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Use previous month metrics if available, otherwise use trend values
  const revenueTrendPercent = previousMetrics ? calculatePercentageChange(metrics?.totalRevenue || 0, previousMetrics.totalRevenue) : (metrics?.revenueTrend || 0);
  const profitTrendPercent = previousMetrics ? calculatePercentageChange(metrics?.estimatedProfit || 0, previousMetrics.estimatedProfit) : (metrics?.profitTrend || 0);
  const expiryTrendPercent = previousMetrics ? calculatePercentageChange(metrics?.expiryRiskLoss || 0, previousMetrics.expiryRiskLoss) : (metrics?.expiryRiskTrend || 0);
  const deadStockTrendPercent = previousMetrics ? calculatePercentageChange(metrics?.deadStockValue || 0, previousMetrics.deadStockValue) : (metrics?.deadStockTrend || 0);

  const isLoading = metricsQuery.isLoading || alertsQuery.isLoading;

  const metricCards: MetricCard[] = metrics ? [
    {
      title: 'Total Revenue',
      value: `₵${metrics.totalRevenue.toLocaleString()}`,
      // Ghanaian Cedis currency
      trend: revenueTrendPercent,
      icon: <DollarSign className="w-8 h-8" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Estimated Profit',
      value: `₵${metrics.estimatedProfit.toLocaleString()}`,
      // Ghanaian Cedis currency
      trend: profitTrendPercent,
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Expiry Risk Loss',
      value: `₵${metrics.expiryRiskLoss.toLocaleString()}`,
      // Ghanaian Cedis currency
      trend: expiryTrendPercent,
      icon: <AlertTriangle className="w-8 h-8" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Dead Stock Value',
      value: `₵${metrics.deadStockValue.toLocaleString()}`,
      // Ghanaian Cedis currency
      trend: deadStockTrendPercent,
      icon: <Package className="w-8 h-8" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ] : [];

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-red-600'; // Increase in risk is bad
    return 'text-green-600'; // Decrease is good
  };

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? '↑' : '↓';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader description="Monitor your pharmacy's performance metrics and key insights" />
      {/* Clear All Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Clear All Data?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will permanently delete all sales transactions, inventory data, and alerts. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearAll}
                disabled={isClearing}
              >
                {isClearing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>Clear All</>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Month Selector - Primary Filter */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <PharmacySelector
            pharmacyName={selectedPharmacy}
            pharmacyLocation="Accra, Ghana"
            onPharmacyChange={setSelectedPharmacy}
          />
          <div className="flex-1">
            <label className="block text-sm font-medium text-blue-600 mb-2">Select Month</label>
            <input
              type="month"
              value={startDate.substring(0, 7)}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-');
                const firstDay = `${year}-${month}-01`;
                const lastDay = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
                setStartDate(firstDay);
                setEndDate(lastDay);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => handleSaveMetrics()}
              disabled={!metrics || saveMetricsMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4"
            >
              {saveMetricsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Metrics'
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Dashboard Metrics */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-6 md:mt-8">Performance Metrics</h2>
        <div className="flex gap-2">
          <DownloadReport
            metrics={metrics}
            alerts={alerts}
            topProducts={topProducts}
            insights={insights}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 md:h-9 px-3 md:px-2 text-sm md:text-xs"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {metricCards.map((card, index) => (
          <Card key={index} className="p-4 md:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">{card.title}</p>
                <p className={`text-lg md:text-2xl font-bold mt-1 md:mt-2 truncate ${
                  card.title === 'Estimated Profit' && (metrics?.estimatedProfit ?? 0) < 0
                    ? 'text-red-600'
                    : 'text-gray-900'
                }`}>{card.value}</p>
                <div className={`mt-1 md:mt-2 text-xs md:text-sm font-medium ${getTrendColor(card.trend)}`}>
                  {getTrendIcon(card.trend)} {Math.abs(card.trend).toFixed(1)}% vs last month
                </div>
              </div>
              <div className={`${card.bgColor} p-2 md:p-3 rounded-lg flex-shrink-0`}>
                <div className={`${card.color} w-6 h-6 md:w-8 md:h-8`}>{card.icon}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Alerts Banner */}
      {alerts && (
        <div className="space-y-3">
          <h2 className="text-base md:text-lg font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-4 md:w-5 h-4 md:h-5 text-red-600" />
            Immediate Attention Required
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {/* Expiry Risk Alert */}
            <Card
              className={`p-4 cursor-pointer transition-all ${selectedAlert === 'expiry' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setSelectedAlert(selectedAlert === 'expiry' ? null : 'expiry')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Expiry Risk</p>
                  <p className="text-lg md:text-2xl font-bold text-red-600 mt-1">
                    {alerts.expiryRiskProducts.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">products expiring soon</p>
                </div>
                <div className="text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </Card>

            {/* Dead Stock Alert */}
            <Card
              className={`p-4 cursor-pointer transition-all ${selectedAlert === 'deadstock' ? 'ring-2 ring-orange-500' : ''}`}
              onClick={() => setSelectedAlert(selectedAlert === 'deadstock' ? null : 'deadstock')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dead Stock</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {alerts.deadStockProducts.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">no sales in 60 days</p>
                </div>
                <div className="text-orange-600">
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </Card>

            {/* Low Margin Alert */}
            <Card
              className={`p-4 cursor-pointer transition-all ${selectedAlert === 'lowmargin' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => setSelectedAlert(selectedAlert === 'lowmargin' ? null : 'lowmargin')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Margin</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {alerts.lowMarginProducts.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">margin below 20%</p>
                </div>
                <div className="text-yellow-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Profit Trend */}
        {revenueTrend.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Profit Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" name="Revenue" />
                <Line type="monotone" dataKey="profit" stroke="#16a34a" name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Top 10 Profitable Products */}
        {topProducts.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Profitable Products</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="margin" fill="#2563eb" name="Margin %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Key Insights */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {insights.map((insight, index) => {
            const iconMap: Record<string, React.ReactNode> = {
              'TrendingUp': <TrendingUp className="w-5 h-5" />,
              'TrendingDown': <TrendingDown className="w-5 h-5" />,
              'Package': <Package className="w-5 h-5" />,
              'AlertTriangle': <AlertTriangle className="w-5 h-5" />,
              'DollarSign': <DollarSign className="w-5 h-5" />,
              'BarChart3': <BarChart3 className="w-5 h-5" />,
              'CheckCircle': <CheckCircle className="w-5 h-5" />,
            };

            const colorMap: Record<string, string> = {
              'red': 'bg-red-600',
              'green': 'bg-green-600',
              'orange': 'bg-orange-600',
              'blue': 'bg-blue-600',
            };

            return (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-md ${colorMap[insight.color]} text-white`}>
                    {iconMap[insight.icon]}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
