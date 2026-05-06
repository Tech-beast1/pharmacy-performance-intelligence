import SmartUpload from '@/components/SmartUpload';
import PageHeader from '@/components/PageHeader';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';

export default function DataUpload() {
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    // Try to read from sessionStorage first
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('selectedMonth') : null;
    if (stored) {
      try {
        const parts = stored.split('-');
        if (parts.length === 2) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          if (!isNaN(year) && !isNaN(month) && year > 0 && month > 0 && month <= 12) {
            return new Date(year, month - 1, 1);
          }
        }
      } catch (e) {
        // Fallback to current date if parsing fails
      }
    }
    return new Date();
  });
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  
  // Get user type to determine if they're an organization owner
  const userTypeQuery = trpc.branches.userType.get.useQuery();
  const userType = userTypeQuery.data?.data?.type;
  
  // Get organization if user is organization owner
  const organizationListQuery = trpc.branches.organization.list.useQuery();
  const organization = organizationListQuery.data?.data?.[0];
  
  // Get branches for organization owner
  const branchesQuery = trpc.branches.branch.list.useQuery(
    { organizationId: organization?.id || 0 },
    { enabled: !!organization?.id && userType === 'organization_owner' }
  );
  const branches = branchesQuery.data?.data || [];

  return (
    <div className="space-y-6">
    <PageHeader title="Data Upload" description="Upload your sales and inventory data" />
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Upload</h1>
          <p className="text-gray-600 mt-1">Import your pharmacy sales and inventory data</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {userType === 'organization_owner' && branches.length > 0 && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload for Branch:</label>
              <select
                value={selectedBranchId || ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a branch...</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload for Month:</label>
            <input
              type="month"
              value={selectedMonth.toISOString().slice(0, 7)}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-');
                const newDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                setSelectedMonth(newDate);
                // Store in sessionStorage so dashboard can read it
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('selectedMonth', e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <SmartUpload uploadDate={selectedMonth} branchId={selectedBranchId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Supported File Formats</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ CSV (Comma-Separated Values)</li>
            <li>✓ XLSX (Excel 2007+)</li>
            <li>✓ XLS (Excel 97-2003)</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Sales Data Columns</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Item Name/Product</li>
            <li>✓ Quantity</li>
            <li>✓ Unit Cost</li>
            <li>✓ Selling Price</li>
          </ul>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Inventory Data Columns</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Item/Product Name</li>
            <li>✓ Unit Cost</li>
            <li>✓ Selling Cost</li>
            <li>✓ Stock on Hand</li>
            <li>✓ Expiry Date</li>
            <li>✓ Qty Sold (90 days)</li>
          </ul>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Overhead Costs</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Rent</li>
            <li>✓ Salaries</li>
            <li>✓ Electricity</li>
            <li>✓ Others</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
