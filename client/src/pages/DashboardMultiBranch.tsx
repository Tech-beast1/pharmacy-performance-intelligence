import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { BranchSelector } from '@/components/BranchSelector';
import { trpc } from '../lib/trpc';
import { AlertCircle, TrendingUp, Package, AlertTriangle, DollarSign } from 'lucide-react';

export default function DashboardMultiBranch() {
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const userTypeQuery = trpc.branches.userType.get.useQuery();
  const dashboardQuery = trpc.analytics.getDashboardMetrics.useQuery({});

  const userType = userTypeQuery.data?.data?.type;
  const metrics = dashboardQuery.data?.data;

  if (userTypeQuery.isLoading || dashboardQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Branch Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pharmacy Performance Intelligence</h1>
          <p className="text-gray-600 mt-1">Monitor your pharmacy's performance metrics and key insights</p>
        </div>
        {userType === 'organization_owner' && (
          <BranchSelector selectedBranchId={selectedBranchId} onBranchChange={setSelectedBranchId} />
        )}
      </div>

      {/* Performance Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₵{metrics.totalRevenue?.toLocaleString('en-US', { maximumFractionDigits: 1 }) || '0'}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  ↓ 0.0% vs last month
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Estimated Profit */}
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">Estimated Profit</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₵{metrics.estimatedProfit?.toLocaleString('en-US', { maximumFractionDigits: 1 }) || '0'}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  ↓ 0.0% vs last month
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Expiry Risk Loss */}
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">Expiry Risk Loss</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₵{metrics.expiryRiskLoss?.toLocaleString('en-US', { maximumFractionDigits: 1 }) || '0'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Potential loss from expiring products
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>

          {/* Dead Stock Value */}
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">Dead Stock Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₵{metrics.deadStockValue?.toLocaleString('en-US', { maximumFractionDigits: 1 }) || '0'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Value of slow-moving inventory
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Immediate Attention Required */}
      <Card className="p-6 border-red-200 bg-red-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Immediate Attention Required
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Expiry Risk */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiry Risk</p>
                <p className="text-2xl font-bold text-red-600">0</p>
                <p className="text-xs text-gray-500 mt-1">products expiring soon</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </Card>

          {/* Dead Stock */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dead Stock</p>
                <p className="text-2xl font-bold text-orange-600">0</p>
                <p className="text-xs text-gray-500 mt-1">no sales in 60 days</p>
              </div>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
          </Card>

          {/* Low Margin */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Margin</p>
                <p className="text-2xl font-bold text-yellow-600">0</p>
                <p className="text-xs text-gray-500 mt-1">margin below 20%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>
        </div>
      </Card>

      {/* Branch Breakdown (for org owners viewing all branches) */}
      {userType === 'organization_owner' && selectedBranchId === null && (
        <BranchBreakdownTable />
      )}
    </div>
  );
}

function BranchBreakdownTable() {
  const branchesQuery = trpc.branches.branch.list.useQuery({ organizationId: 0 });
  const branches = branchesQuery.data?.data || [];

  if (branchesQuery.isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (branches.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Performance Breakdown</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Branch</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Location</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch: any) => (
              <tr key={branch.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{branch.name}</td>
                <td className="text-right py-3 px-4 text-gray-600">{branch.location || 'N/A'}</td>
                <td className="text-right py-3 px-4">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
