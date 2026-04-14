import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { AlertCircle, TrendingUp, Target, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';

export default function ReportsInsights() {
  const [viewMode, setViewMode] = useState<'top10' | 'all'>('top10');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get selected month from localStorage (synced with Dashboard)
  const getStoredMonth = () => {
    try {
      const stored = localStorage.getItem('selectedMonth');
      return stored ? parseInt(stored) : new Date().getMonth() + 1;
    } catch {
      return new Date().getMonth() + 1;
    }
  };

  const getStoredYear = () => {
    try {
      const stored = localStorage.getItem('selectedYear');
      return stored ? parseInt(stored) : new Date().getFullYear();
    } catch {
      return new Date().getFullYear();
    }
  };

  const month = getStoredMonth();
  const year = getStoredYear();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const metricsQuery = trpc.analytics.getDashboardMetrics.useQuery({ startDate, endDate, durationDays: 60 });
  const alertsQuery = trpc.analytics.getAlerts.useQuery({ durationDays: 60 });
  const topProductsQuery = trpc.analytics.getTopProducts.useQuery();
  const revenueTrendQuery = trpc.analytics.getRevenueTrend.useQuery();
  const totalProductsQuery = trpc.analytics.getTotalProductsCount.useQuery({ startDate, endDate });

  const metrics = metricsQuery.data?.data;
  const alerts = alertsQuery.data?.data;
  const topProducts = topProductsQuery.data?.data || [];
  const revenueTrend = revenueTrendQuery.data?.data || [];
  const totalProductsCount = totalProductsQuery.data?.data || 0;

  const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ea580c', '#eab308'];

  // Prepare alert distribution data
  const alertDistribution = [
    { name: 'Expiry Risk', value: alerts?.expiryRiskProducts.length || 0 },
    { name: 'Dead Stock', value: alerts?.deadStockProducts.length || 0 },
    { name: 'Low Margin', value: alerts?.lowMarginProducts.length || 0 },
  ];

  // Pagination logic for all products
  const totalPages = Math.ceil(topProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = topProducts.slice(startIndex, endIndex);

  // Data for charts
  const top10Products = topProducts.slice(0, 10);
  const chartData = viewMode === 'top10' ? top10Products : paginatedProducts;

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Insights" description="View detailed reports and insights" />
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
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalProductsCount}</p>
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
                  ? Math.round(topProducts.reduce((sum: number, p: any) => sum + p.margin, 0) / topProducts.length)
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
                {(alerts?.expiryRiskProducts.length || 0) +
                  (alerts?.deadStockProducts.length || 0) +
                  (alerts?.lowMarginProducts.length || 0)}
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
                {metrics ? Math.round((metrics.estimatedProfit / metrics.totalRevenue) * 100) : 0}%
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

        {/* Products Chart with Tabs */}
        {topProducts.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {viewMode === 'top10' ? 'Top 10 Products by Margin' : `All Products by Margin (Page ${currentPage}/${totalPages})`}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'top10' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setViewMode('top10');
                    setCurrentPage(1);
                  }}
                >
                  Top 10
                </Button>
                <Button
                  variant={viewMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setViewMode('all');
                    setCurrentPage(1);
                  }}
                >
                  All ({topProducts.length})
                </Button>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="margin" fill="#2563eb" name="Margin %" />
              </BarChart>
            </ResponsiveContainer>

            {/* Pagination Controls for All Products View */}
            {viewMode === 'all' && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, topProducts.length)} of {topProducts.length} products
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-700">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
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
              <span className="font-bold text-gray-900">₵{metrics?.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Total Profit</span>
              <span className="font-bold text-gray-900">₵{metrics?.estimatedProfit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Expiry Risk Loss</span>
              <span className="font-bold text-red-600">₵{metrics?.expiryRiskLoss.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dead Stock Value</span>
              <span className="font-bold text-orange-600">₵{metrics?.deadStockValue.toLocaleString()}</span>
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
                You have ₵{metrics?.expiryRiskLoss.toLocaleString()} worth of products expiring soon. Implement promotional strategies to clear these items.
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
                ₵{metrics?.deadStockValue.toLocaleString()} is tied up in products with no recent sales. Consider bundling or discounting these items.
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
                {alerts?.lowMarginProducts.length || 0} products have margins below 20%. Review pricing or reduce costs to improve profitability.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
