import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { AlertTriangle, Package, TrendingDown, TrendingUp, DollarSign, BarChart3, CheckCircle, Trash2 } from 'lucide-react';
import DownloadReport from '@/components/DownloadReport';

export default function DashboardMultiBranch() {
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const date = new Date();
    return date.toISOString().slice(0, 7);
  });

  // Get user's organization
  const organizationsQuery = trpc.branches.organization.list.useQuery();
  const organization = organizationsQuery.data?.data?.[0]; // Get first organization

  // Get branches for the organization
  const branchesQuery = trpc.branches.branch.list.useQuery(
    { organizationId: organization?.id || 0 },
    { enabled: !!organization?.id }
  );
  const branches = branchesQuery.data?.data || [];

  // Get consolidated or individual metrics
  const metricsQuery = selectedBranchId
    ? trpc.branches.metrics.branch.useQuery(
        { branchId: selectedBranchId, month: selectedMonth },
        { enabled: !!selectedBranchId }
      )
    : trpc.branches.metrics.consolidated.useQuery(
        { organizationId: organization?.id || 0, month: selectedMonth },
        { enabled: !!organization?.id }
      );

  const metrics = metricsQuery.data?.data;

  // Get branch breakdown for comparison table
  const breakdownQuery = trpc.branches.metrics.breakdown.useQuery(
    { organizationId: organization?.id || 0, month: selectedMonth },
    { enabled: !!organization?.id && !selectedBranchId }
  );
  const breakdown = breakdownQuery.data?.data || [];

  // Get AI-powered insights
  const startDate = `${selectedMonth}-01`;
  const endDate = new Date(selectedMonth + '-01');
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  const insightsQuery = trpc.analytics.getKeyInsights.useQuery({
    startDate,
    endDate: endDate.toISOString().split('T')[0],
  });
  const insights = insightsQuery.data?.data || [];

  const selectedBranchName = selectedBranchId
    ? branches.find(b => b.id === selectedBranchId)?.name
    : 'All Branches (Consolidated)';

  // Clear All functionality
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const clearAllMutation = trpc.data.clearAll.useMutation();

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      // Clear all data by passing current month/year
      const now = new Date();
      await clearAllMutation.mutateAsync({ month: now.getMonth() + 1, year: now.getFullYear() });
      setShowClearConfirm(false);
      // Reload after a brief delay to allow mutation to complete
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Error clearing data:', error);
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Multi-Branch Dashboard</h1>
          <p className="text-blue-100">{organization?.name} • {branches.length} branch{branches.length !== 1 ? 'es' : ''}</p>
        </div>
        <div className="flex gap-3">
          <DownloadReport />
          <Button
            onClick={() => setShowClearConfirm(true)}
            variant="destructive"
            className="gap-2"
          >
            <Trash2 size={18} />
            Clear All
          </Button>
        </div>
      </div>

      {/* Branch Selector and Month Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">View Branch:</label>
          <select
            value={selectedBranchId || 'all'}
            onChange={(e) => setSelectedBranchId(e.target.value === 'all' ? null : parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Branches (Consolidated)</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">₵{metrics.totalRevenue?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="text-4xl text-blue-500">₵</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Estimated Profit</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">₵{metrics.estimatedProfit?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="text-4xl text-green-500">📈</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Expiry Risk Loss</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">₵{metrics.expiryRiskLoss?.toFixed(2) || '0.00'}</p>
                </div>
                <AlertTriangle className="text-red-500" size={32} />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Dead Stock Value</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">₵{metrics.deadStockValue?.toFixed(2) || '0.00'}</p>
                </div>
                <Package className="text-orange-500" size={32} />
              </div>
            </Card>
          </div>

          {/* Alerts Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 border-l-4 border-red-500 bg-red-50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={28} />
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiry Risk</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.expiryRiskCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">products expiring soon</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-orange-500 bg-orange-50">
              <div className="flex items-center gap-3">
                <Package className="text-orange-500" size={28} />
                <div>
                  <p className="text-sm font-medium text-gray-600">Dead Stock</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.deadStockCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">no sales in 60 days</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-yellow-500 bg-yellow-50">
              <div className="flex items-center gap-3">
                <TrendingDown className="text-yellow-600" size={28} />
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Margin</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.lowMarginCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">margin below 20%</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Branch Breakdown Table - Only show when viewing all branches */}
          {!selectedBranchId && breakdown && breakdown.length > 1 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Performance Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Branch Name</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Profit</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((branch: any, index: number) => (
                      <tr key={branch.branchId} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}>
                        <td className="py-3 px-4 text-gray-900 font-medium">{branch.branchName}</td>
                        <td className="text-right py-3 px-4 text-gray-700">₵{branch.revenue?.toFixed(2) || '0.00'}</td>
                        <td className="text-right py-3 px-4 text-gray-700">₵{branch.profit?.toFixed(2) || '0.00'}</td>
                        <td className="text-right py-3 px-4 text-gray-700">{branch.marginPercentage?.toFixed(1) || '0.0'}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Key Insights */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {insights.map((insight: any, index: number) => {
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
                    You have ₵{metrics?.expiryRiskLoss?.toLocaleString() || '0'} worth of products expiring soon. Implement promotional strategies to clear these items.
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
                    ₵{metrics?.deadStockValue?.toLocaleString() || '0'} is tied up in products with no recent sales. Consider bundling or discounting these items.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-sm font-bold">3</div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Optimize Branch Performance</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Compare branch metrics in the table above to identify top performers and areas for improvement across your network.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}



      {/* Clear All Confirmation Dialog */}
      {showClearConfirm && (
        <Card className="p-6 bg-red-50 border-l-4 border-red-500">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Clear All Data?</h3>
          <p className="text-gray-600 mb-4">This will permanently delete all inventory, sales, and overhead data. This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button
              onClick={() => handleClearAll()}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClearing ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Clearing...
                </>
              ) : (
                <>Clear All</>
              )}
            </Button>
            <Button
              onClick={() => setShowClearConfirm(false)}
              disabled={isClearing}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {(metricsQuery.isLoading || breakdownQuery.isLoading) && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading metrics...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {(metricsQuery.isError || breakdownQuery.isError) && (
        <Card className="p-6 border-l-4 border-red-500 bg-red-50">
          <p className="text-red-700 font-medium">Error loading dashboard metrics. Please try again.</p>
        </Card>
      )}
    </div>
  );
}
