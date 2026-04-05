import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { AlertCircle, TrendingUp, Target, Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function ReportsInsights() {
  const metricsQuery = trpc.dashboard.getMetrics.useQuery();

  const metrics = metricsQuery.data?.metrics;
  const alerts = metricsQuery.data?.alerts || [];
  const topProducts = metricsQuery.data?.topProducts || [];
  const revenueTrend = metricsQuery.data?.trend || [];

  const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ea580c', '#eab308'];

  // Count alerts by type
  const expiryCount = alerts.filter((a: any) => a.alertType === 'expiry_risk').length;
  const deadStockCount = alerts.filter((a: any) => a.alertType === 'dead_stock').length;
  const lowMarginCount = alerts.filter((a: any) => a.alertType === 'low_margin').length;

  // Prepare alert distribution data
  const alertDistribution = [
    { name: 'Expiry Risk', value: expiryCount },
    { name: 'Dead Stock', value: deadStockCount },
    { name: 'Low Margin', value: lowMarginCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Insights</h1>
        <p className="text-gray-600 mt-1">Detailed analytics and business intelligence</p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{topProducts.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg Margin</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {topProducts.length > 0
                  ? Math.round(topProducts.reduce((sum: number, p: any) => sum + (p.margin || 0), 0) / topProducts.length)
                  : 0}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Alert Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {expiryCount + deadStockCount + lowMarginCount}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Profit Margin</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metrics && metrics.totalRevenue > 0 ? Math.round((metrics.estimatedProfit / metrics.totalRevenue) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        {revenueTrend.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Profit Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Products by Margin</h3>
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

        {/* Alert Distribution */}
        {alertDistribution.some(a => a.value > 0) && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alertDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {alertDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Metrics Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-bold text-gray-900">₵{metrics?.totalRevenue.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Total Profit</span>
              <span className="font-bold text-gray-900">₵{metrics?.estimatedProfit.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Expiry Risk Loss</span>
              <span className="font-bold text-red-600">₵{metrics?.expiryRiskLoss.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dead Stock Value</span>
              <span className="font-bold text-orange-600">₵{metrics?.deadStockValue.toLocaleString() || '0'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-sm font-bold">1</div>
            </div>
            <div>
              <p className="font-medium text-gray-900">Focus on Expiry Management</p>
              <p className="text-sm text-gray-600 mt-1">
                You have ₵{metrics?.expiryRiskLoss.toLocaleString() || '0'} worth of products expiring soon. Implement promotional strategies to clear these items.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-sm font-bold">2</div>
            </div>
            <div>
              <p className="font-medium text-gray-900">Optimize Slow-Moving Stock</p>
              <p className="text-sm text-gray-600 mt-1">
                ₵{metrics?.deadStockValue.toLocaleString() || '0'} is tied up in products with no recent sales. Consider bundling or discounting these items.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-sm font-bold">3</div>
            </div>
            <div>
              <p className="font-medium text-gray-900">Review Low-Margin Products</p>
              <p className="text-sm text-gray-600 mt-1">
                {lowMarginCount} products have margins below 20%. Review pricing or reduce costs to improve profitability.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
