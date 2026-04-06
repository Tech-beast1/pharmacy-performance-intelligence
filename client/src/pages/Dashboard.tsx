import { useState } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Package, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import DownloadReport from '@/components/DownloadReport';
import { PharmacyProfileHeader } from '@/components/PharmacyProfileHeader';
import { OnboardingModal } from '@/components/OnboardingModal';
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
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Fetch dashboard data
  const metricsQuery = trpc.analytics.getDashboardMetrics.useQuery();
  const alertsQuery = trpc.analytics.getAlerts.useQuery();
  const topProductsQuery = trpc.analytics.getTopProducts.useQuery();
  const revenueTrendQuery = trpc.analytics.getRevenueTrend.useQuery();

  const metrics = metricsQuery.data?.data;
  const alerts = alertsQuery.data?.data;
  const topProducts = topProductsQuery.data?.data || [];
  const revenueTrend = revenueTrendQuery.data?.data || [];

  const isLoading = metricsQuery.isLoading || alertsQuery.isLoading;

  const metricCards: MetricCard[] = metrics ? [
    {
      title: 'Total Revenue',
      value: `₵${metrics.totalRevenue.toLocaleString()}`,
      // Ghanaian Cedis currency
      trend: metrics.revenueTrend,
      icon: <DollarSign className="w-8 h-8" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Estimated Profit',
      value: `₵${metrics.estimatedProfit.toLocaleString()}`,
      // Ghanaian Cedis currency
      trend: metrics.profitTrend,
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Expiry Risk Loss',
      value: `₵${metrics.expiryRiskLoss.toLocaleString()}`,
      // Ghanaian Cedis currency
      trend: metrics.expiryRiskTrend,
      icon: <AlertTriangle className="w-8 h-8" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Dead Stock Value',
      value: `₵${metrics.deadStockValue.toLocaleString()}`,
      // Ghanaian Cedis currency
      trend: metrics.deadStockTrend,
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
      {/* Pharmacy Profile Header */}
      <PharmacyProfileHeader onEditClick={() => setIsOnboardingOpen(true)} />

      {/* Onboarding Modal */}
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />

      {/* Dashboard Metrics */}
      <h2 className="text-2xl font-bold text-gray-900 mt-8">Performance Metrics</h2>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                <div className={`mt-2 text-sm font-medium ${getTrendColor(card.trend)}`}>
                  {getTrendIcon(card.trend)} {Math.abs(card.trend).toFixed(1)}% vs last month
                </div>
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <div className={card.color}>{card.icon}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Alerts Banner */}
      {alerts && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Immediate Attention Required
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Expiry Risk Alert */}
            <Card
              className={`p-4 cursor-pointer transition-all ${selectedAlert === 'expiry' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setSelectedAlert(selectedAlert === 'expiry' ? null : 'expiry')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiry Risk</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Slow-Moving Stock</p>
              <p className="text-xs text-gray-600 mt-1">
                ₵{metrics?.deadStockValue.toLocaleString()} tied up in products with no recent sales
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-md bg-green-600 text-white">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Profit Opportunity</p>
              <p className="text-xs text-gray-600 mt-1">
                20% of revenue comes from low-margin products
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-md bg-red-600 text-white">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Expiry Management</p>
              <p className="text-xs text-gray-600 mt-1">
                Reducing expiry losses can increase your profit by 12%
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
