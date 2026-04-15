import { useState, useEffect } from 'react';
import { Home, Users, Zap, MoreHorizontal, Save, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

export default function OverheadCosts() {
  const [location] = useLocation();
  const currentDate = new Date();
  
  // Parse month/year from URL parameters first
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const urlMonth = urlParams.get('month');
  const urlYear = urlParams.get('year');
  
  // Try to read from localStorage (Dashboard's selected month) as fallback
  const getStoredMonth = () => {
    try {
      const stored = localStorage.getItem('selectedMonth');
      return stored ? parseInt(stored) : currentDate.getMonth() + 1;
    } catch {
      return currentDate.getMonth() + 1;
    }
  };
  
  const getStoredYear = () => {
    try {
      const stored = localStorage.getItem('selectedYear');
      return stored ? parseInt(stored) : currentDate.getFullYear();
    } catch {
      return currentDate.getFullYear();
    }
  };
  
  const [month, setMonth] = useState(() => urlMonth ? parseInt(urlMonth) : getStoredMonth());
  const [year, setYear] = useState(() => urlYear ? parseInt(urlYear) : getStoredYear());
  const [rent, setRent] = useState('0');
  const [salaries, setSalaries] = useState('0');
  const [electricity, setElectricity] = useState('0');
  const [others, setOthers] = useState('0');
  const [isSaving, setIsSaving] = useState(false);
  


  // Fetch overhead costs for the selected month/year
  const overheadQuery = trpc.overheadCosts.getByMonth.useQuery({ month, year });
  const saveMutation = trpc.overheadCosts.save.useMutation();

  // Update month/year when URL parameters or localStorage changes
  useEffect(() => {
    if (urlMonth) {
      setMonth(parseInt(urlMonth));
    } else {
      // Read from localStorage if no URL params
      const storedMonth = getStoredMonth();
      setMonth(storedMonth);
    }
    
    if (urlYear) {
      setYear(parseInt(urlYear));
    } else {
      // Read from localStorage if no URL params
      const storedYear = getStoredYear();
      setYear(storedYear);
    }
  }, [location]);
  
  // Also listen for localStorage changes (when Dashboard updates)
  useEffect(() => {
    const handleStorageChange = () => {
      if (!urlMonth) setMonth(getStoredMonth());
      if (!urlYear) setYear(getStoredYear());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [urlMonth, urlYear]);

  // Load existing data when query returns
  useEffect(() => {
    if (overheadQuery.data?.data) {
      const data = overheadQuery.data.data;
      setRent(data.rent?.toString() || '0');
      setSalaries(data.salaries?.toString() || '0');
      setElectricity(data.electricity?.toString() || '0');
      setOthers(data.others?.toString() || '0');
    }
  }, [overheadQuery.data]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({
        month,
        year,
        rent: parseFloat(rent) || 0,
        salaries: parseFloat(salaries) || 0,
        electricity: parseFloat(electricity) || 0,
        others: parseFloat(others) || 0,
      });
      toast.success('Overhead costs saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save overhead costs';
      toast.error(errorMessage);
      console.error('Overhead costs save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const totalOverhead = (parseFloat(rent) || 0) + (parseFloat(salaries) || 0) + (parseFloat(electricity) || 0) + (parseFloat(others) || 0);

  // Fetch dashboard metrics to get gross profit
  const metricsQuery = trpc.analytics.getDashboardMetrics.useQuery({ durationDays: 30 });
  const grossProfit = metricsQuery.data?.data?.estimatedProfit || 0;
  const netProfit = grossProfit - totalOverhead;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
    <PageHeader title="Overhead Costs" description="Manage your pharmacy overhead costs" />
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Overhead Costs Management</h1>
        <p className="text-gray-600 mt-1">Track and manage your pharmacy's operational expenses</p>
      </div>

      {/* Month/Year Selector */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Period</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {monthNames.map((name, index) => (
                <option key={index + 1} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Overhead Costs Input Form */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Overhead Costs for {monthNames[month - 1]} {year}</h2>
        
        <div className="space-y-6">
          {/* Rent */}
          <div className="border-b pb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
              <label className="text-lg font-medium text-gray-900">Rent</label>
            </div>
            <Input
              type="number"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              placeholder="Enter rent amount"
              className="w-full"
              step="0.01"
              min="0"
            />
            <p className="text-sm text-gray-500 mt-2">Monthly rent for the pharmacy premises</p>
          </div>

          {/* Salaries */}
          <div className="border-b pb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <label className="text-lg font-medium text-gray-900">Salaries</label>
            </div>
            <Input
              type="number"
              value={salaries}
              onChange={(e) => setSalaries(e.target.value)}
              placeholder="Enter total salaries"
              className="w-full"
              step="0.01"
              min="0"
            />
            <p className="text-sm text-gray-500 mt-2">Total staff salaries for the month</p>
          </div>

          {/* Electricity */}
          <div className="border-b pb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-600" />
              </div>
              <label className="text-lg font-medium text-gray-900">Electricity</label>
            </div>
            <Input
              type="number"
              value={electricity}
              onChange={(e) => setElectricity(e.target.value)}
              placeholder="Enter electricity bill"
              className="w-full"
              step="0.01"
              min="0"
            />
            <p className="text-sm text-gray-500 mt-2">Monthly electricity and utilities bill</p>
          </div>

          {/* Others */}
          <div className="pb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <MoreHorizontal className="w-5 h-5 text-purple-600" />
              </div>
              <label className="text-lg font-medium text-gray-900">Others</label>
            </div>
            <Input
              type="number"
              value={others}
              onChange={(e) => setOthers(e.target.value)}
              placeholder="Enter other costs"
              className="w-full"
              step="0.01"
              min="0"
            />
            <p className="text-sm text-gray-500 mt-2">Insurance, maintenance, supplies, and other operational costs</p>
          </div>
        </div>

        {/* Total Summary */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Total Monthly Overhead Costs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">₵{totalOverhead.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 mb-2">Breakdown:</p>
              <p className="text-xs text-gray-600">Rent: ₵{(parseFloat(rent) || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-600">Salaries: ₵{(parseFloat(salaries) || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-600">Electricity: ₵{(parseFloat(electricity) || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-600">Others: ₵{(parseFloat(others) || 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="mt-8 flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Overhead Costs
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Profit Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gross Profit Card */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-gray-700">Gross Profit</p>
              </div>
              <p className="text-3xl font-bold text-green-700 mt-2">
                ₵{grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-600 mt-2">Original estimated profit before overhead deduction</p>
            </div>
          </div>
        </Card>

        {/* Net Profit Card */}
        <Card className={`p-6 border-2 ${
          netProfit >= 0
            ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
            : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {netProfit >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <p className="text-sm font-medium text-gray-700">Net Profit</p>
              </div>
              <p className={`text-3xl font-bold mt-2 ${
                netProfit >= 0 ? 'text-blue-700' : 'text-red-700'
              }`}>
                ₵{netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-600 mt-2">Profit after deducting overhead costs (Gross Profit - Overhead Costs)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Information Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-2">How Overhead Costs Affect Profit Calculation</h3>
        <p className="text-sm text-gray-700">
          The estimated profit calculation for the entire sales data is updated to include overhead costs:
        </p>
        <div className="mt-3 p-3 bg-white rounded border border-blue-200">
          <p className="text-sm font-mono text-gray-800">
            Net Profit = Estimated Profit - Overhead Cost
          </p>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Monthly overhead cost is the total operational expenses for the month, applied to profit calculations.
        </p>
      </Card>
    </div>
  );
}
