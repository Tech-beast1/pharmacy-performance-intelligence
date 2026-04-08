import { useState, useMemo } from 'react';
import { AlertTriangle, Package, TrendingDown, ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

export default function InventoryIntelligence() {
  const [filterAlert, setFilterAlert] = useState<'all' | 'expiry' | 'deadstock' | 'lowmargin'>('all');
  const [durationDays, setDurationDays] = useState<number>(60);
  const [sortKey, setSortKey] = useState<SortKey>('productName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const inventoryQuery = trpc.inventory.getAll.useQuery();
  const alertsQuery = trpc.analytics.getAlerts.useQuery({ durationDays });

  const inventory = inventoryQuery.data?.data || [];
  const alerts = alertsQuery.data?.data;

  // Calculate margin for each item
  const itemsWithMargin = useMemo(() => {
    return inventory.map(item => {
      const costPrice = parseFloat(item.costPrice?.toString() || '0');
      const salePrice = parseFloat(item.price.toString());
      const margin = costPrice > 0 ? ((salePrice - costPrice) / costPrice) * 100 : 0;
      return { ...item, margin: Math.round(margin) };
    });
  }, [inventory]);

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

    if (alerts.expiryRiskProducts.some((p: any) => p.id === item.id)) {
      return { type: 'expiry', label: 'Expiry Risk', color: 'bg-red-100 text-red-800' };
    }
    if (alerts.deadStockProducts.some((p: any) => p.id === item.id)) {
      return { type: 'deadstock', label: 'Dead Stock', color: 'bg-orange-100 text-orange-800' };
    }
    if (alerts.lowMarginProducts.some((p: any) => p.id === item.id)) {
      return { type: 'lowmargin', label: 'Low Margin', color: 'bg-yellow-100 text-yellow-800' };
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Intelligence</h1>
        <p className="text-gray-600 mt-1">View and manage your pharmacy inventory</p>
      </div>

      {/* Filter Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
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
          <div className="text-sm text-gray-600">
            Showing {sortedItems.length} of {itemsWithMargin.length} items
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="p-4">
                  <SortHeader label="Product Name" sortBy="productName" />
                </TableHead>
                <TableHead className="p-4 text-right">
                  <SortHeader label="Price" sortBy="price" />
                </TableHead>
                <TableHead className="p-4 text-right">
                  <SortHeader label="Quantity" sortBy="quantity" />
                </TableHead>
                <TableHead className="p-4 text-right">
                  <SortHeader label="Margin %" sortBy="margin" />
                </TableHead>
                <TableHead className="p-4">
                  <SortHeader label="Expiry Date" sortBy="expiryDate" />
                </TableHead>
                <TableHead className="p-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.length > 0 ? (
                sortedItems.map((item) => {
                  const alertStatus = getAlertStatus(item);
                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50 border-b">
                      <TableCell className="p-4 font-medium text-gray-900">{item.productName}</TableCell>
                      <TableCell className="p-4 text-right text-gray-700">
                        ₵{parseFloat(item.price.toString()).toLocaleString()}
                      </TableCell>
                      <TableCell className="p-4 text-right text-gray-700">{item.quantity}</TableCell>
                      <TableCell className="p-4 text-right">
                        <span className={`font-semibold ${item.margin >= 20 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.margin}%
                        </span>
                      </TableCell>
                      <TableCell className="p-4 text-gray-700">
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="p-4">
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
