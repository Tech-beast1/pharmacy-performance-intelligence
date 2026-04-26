import { useState, useMemo } from 'react';
import { AlertTriangle, Package, TrendingDown, ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import DownloadReport from '@/components/DownloadReport';
import { trpc } from '@/lib/trpc';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortKey = 'productName' | 'price' | 'quantity' | 'margin' | 'expiryDate';
type SortOrder = 'asc' | 'desc';

// Format date consistently without timezone conversion
const formatDate = (dateValue: any): string => {
  if (!dateValue) return '-';
  
  try {
    // If it's a string date (YYYY-MM-DD), return as-is
    if (typeof dateValue === 'string') {
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue;
      }
      // Try to parse and format
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        // Format as YYYY-MM-DD using UTC to avoid timezone issues
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    
    // If it's a Date object
    if (dateValue instanceof Date) {
      const year = dateValue.getUTCFullYear();
      const month = String(dateValue.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return '-';
  } catch (error) {
    return '-';
  }
};

export default function InventoryIntelligence() {
  const [filterAlert, setFilterAlert] = useState<'all' | 'expiry' | 'deadstock' | 'lowmargin'>('all');
  const [durationDays, setDurationDays] = useState<number>(60);
  const [sortKey, setSortKey] = useState<SortKey>('productName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
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

  const inventoryQuery = trpc.inventory.getAll.useQuery();
  const alertsQuery = trpc.analytics.getAlerts.useQuery({ 
    startDate,
    endDate,
    durationDays
  });

  const inventory = inventoryQuery.data?.data || [];
  const alerts = alertsQuery.data?.data;

  // Calculate margin for each item and deduplicate by product name
  // Prioritize items with alert status (expiry risk, dead stock, low margin)
  const itemsWithMargin = useMemo(() => {
    const productMap = new Map();
    inventory.forEach(item => {
      const productName = item.productName?.toLowerCase().trim() || '';
      const existing = productMap.get(productName);
      
      // Check if current item has an alert status
      const currentHasAlert = alerts && (
        alerts.expiryRiskProducts.some((p: any) => p.id === item.id) ||
        alerts.deadStockProducts.some((p: any) => p.id === item.id) ||
        alerts.lowMarginProducts.some((p: any) => p.id === item.id)
      );
      
      // Check if existing item has an alert status
      const existingHasAlert = existing && alerts && (
        alerts.expiryRiskProducts.some((p: any) => p.id === existing.id) ||
        alerts.deadStockProducts.some((p: any) => p.id === existing.id) ||
        alerts.lowMarginProducts.some((p: any) => p.id === existing.id)
      );
      
      // Keep the item with alert status, or the latest if neither/both have alerts
      if (!existing || currentHasAlert || !existingHasAlert) {
        productMap.set(productName, item);
      }
    });
    return Array.from(productMap.values()).map(item => {
      const costPrice = parseFloat(item.costPrice?.toString() || '0');
      const salePrice = parseFloat(item.price.toString());
      const margin = costPrice > 0 ? ((salePrice - costPrice) / costPrice) * 100 : 0;
      return { ...item, margin: Math.round(margin) };
    });
  }, [inventory, alerts]);

  // Filter items based on selected alert type
  const filteredItems = useMemo(() => {
    if (!alerts) return itemsWithMargin;

    let result = itemsWithMargin;

    if (filterAlert === 'expiry') {
      const expiryIds = new Set(alerts.expiryRiskProducts.map((p: any) => p.id));
      result = result.filter(item => expiryIds.has(item.id));
    } else if (filterAlert === 'deadstock') {
      const deadstockIds = new Set(alerts.deadStockProducts.map((p: any) => p.id));
      result = result.filter(item => deadstockIds.has(item.id));
    } else if (filterAlert === 'lowmargin') {
      const lowmarginIds = new Set(alerts.lowMarginProducts.map((p: any) => p.id));
      result = result.filter(item => lowmarginIds.has(item.id));
    }

    return result;
  }, [itemsWithMargin, alerts, filterAlert]);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems].sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];

      if (sortKey === 'price' || sortKey === 'quantity' || sortKey === 'margin') {
        aVal = parseFloat(aVal?.toString() || '0');
        bVal = parseFloat(bVal?.toString() || '0');
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredItems, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const SortHeader = ({ label, sortBy }: { label: string; sortBy: SortKey }) => (
    <button
      onClick={() => handleSort(sortBy)}
      className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600"
    >
      {label}
      {sortKey === sortBy && (
        <ArrowUpDown className={`w-4 h-4 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} />
      )}
    </button>
  );

  const getAlertStatus = (item: any) => {
    if (!alerts) return null;

    const isDeadStock = alerts.deadStockProducts.some((p: any) => p.id === item.id);
    const isExpiryRisk = alerts.expiryRiskProducts.some((p: any) => p.id === item.id);
    const isLowMargin = alerts.lowMarginProducts.some((p: any) => p.id === item.id);

    // If filtering by a specific alert type, show only that status
    if (filterAlert === 'deadstock' && isDeadStock) {
      return { type: 'deadstock', label: 'Dead Stock', color: 'bg-orange-100 text-orange-800' };
    }
    if (filterAlert === 'expiry' && isExpiryRisk) {
      return { type: 'expiry', label: 'Expiry Risk', color: 'bg-red-100 text-red-800' };
    }
    if (filterAlert === 'lowmargin' && isLowMargin) {
      return { type: 'lowmargin', label: 'Low Margin', color: 'bg-yellow-100 text-yellow-800' };
    }

    // If showing all items, display all applicable statuses
    if (filterAlert === 'all') {
      const statuses = [];
      const colors = [];

      if (isDeadStock) {
        statuses.push('Dead Stock');
        colors.push('bg-orange-100 text-orange-800');
      }
      if (isExpiryRisk) {
        statuses.push('Expiry Risk');
        colors.push('bg-red-100 text-red-800');
      }
      if (isLowMargin) {
        statuses.push('Low Margin');
        colors.push('bg-yellow-100 text-yellow-800');
      }

      if (statuses.length === 0) return null;

      return {
        type: statuses.map(s => s.toLowerCase().replace(' ', '')).join('_'),
        label: statuses.join(' & '),
        color: colors[0]
      };
    }

    return null;
  };

  return (
    <div className="space-y-6">
    <PageHeader title="Inventory Intelligence" description="Analyze your inventory and dead stock" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Intelligence</h1>
        <p className="text-gray-600 mt-1">View and manage your pharmacy inventory</p>
      </div>

      {/* Filter Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Dead Stock Duration</label>
            <Select value={durationDays.toString()} onValueChange={(value) => setDurationDays(parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="60">Last 60 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="120">Last 120 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Alert Status</label>
            <Select value={filterAlert} onValueChange={(value: any) => setFilterAlert(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="expiry">Expiry Risk</SelectItem>
                <SelectItem value="deadstock">Dead Stock</SelectItem>
                <SelectItem value="lowmargin">Low Margin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              Showing {sortedItems.length} of {itemsWithMargin.length} items
            </div>
            <DownloadReport inventoryData={sortedItems} alerts={alerts} />
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="p-4 text-center">
                  <SortHeader label="Product Name" sortBy="productName" />
                </TableHead>
                <TableHead className="p-4 text-center">
                  <SortHeader label="Price" sortBy="price" />
                </TableHead>
                <TableHead className="p-4 text-center">
                  <SortHeader label="Quantity" sortBy="quantity" />
                </TableHead>
                <TableHead className="p-4 text-center">
                  <SortHeader label="Margin %" sortBy="margin" />
                </TableHead>
                <TableHead className="p-4 text-center">Dead Stock Value</TableHead>
                <TableHead className="p-4 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.length > 0 ? (
                sortedItems.map((item) => {
                  const alertStatus = getAlertStatus(item);
                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50 border-b">
                      <TableCell className="p-4 font-medium text-gray-900 text-center">{item.productName}</TableCell>
                      <TableCell className="p-4 text-center text-gray-700">
                        ₵{parseFloat(item.price.toString()).toLocaleString()}
                      </TableCell>
                      <TableCell className="p-4 text-center text-gray-700">{item.quantity}</TableCell>
                      <TableCell className="p-4 text-center">
                        <span className={`font-semibold ${item.margin >= 20 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.margin}%
                        </span>
                      </TableCell>
                      <TableCell className="p-4 text-center text-gray-700">
                        {alertStatus?.label === 'Dead Stock' ? `₵${(parseFloat(item.price.toString()) * item.quantity).toLocaleString()}` : '₵0'}
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        {alertStatus ? (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${alertStatus.color}`}>
                            {alertStatus.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">OK</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-gray-500">
                    No inventory items found
                  </TableCell>
                </TableRow>
              )}
              {sortedItems.length > 0 && (
                <TableRow className="bg-gray-100 font-bold">
                  <TableCell colSpan={5} className="p-4 text-right">Total Dead Stock Value:</TableCell>
                  <TableCell className="p-4 text-center text-gray-900">
                    ₵{alerts?.deadStockProducts.reduce((total: number, item: any) => {
                      return total + (parseFloat(item.price.toString()) * item.quantity);
                    }, 0).toLocaleString() || '0'}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Expiry Risk</p>
              <p className="text-2xl font-bold text-gray-900">{alerts?.expiryRiskProducts.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Dead Stock</p>
              <p className="text-2xl font-bold text-gray-900">{alerts?.deadStockProducts.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Margin</p>
              <p className="text-2xl font-bold text-gray-900">{alerts?.lowMarginProducts.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
