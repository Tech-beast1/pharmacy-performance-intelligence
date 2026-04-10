import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DownloadReportProps {
  metrics?: any;
  alerts?: any;
  topProducts?: any[];
  inventoryData?: any[];
}

// Safe number conversion utility
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Safe string formatting
const formatCurrency = (value: any): string => {
  const num = toNumber(value);
  return `₵${num.toFixed(2)}`;
};

export default function DownloadReport({
  metrics,
  alerts,
  topProducts = [],
  inventoryData = [],
}: DownloadReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Check if we have any data to export
      if (!metrics && !alerts && topProducts.length === 0 && inventoryData.length === 0) {
        toast.error('No data available to export');
        setIsGenerating(false);
        return;
      }

      let csvContent = 'Pharmacy Performance Intelligence Report\n';
      csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

      // Add Metrics Section
      if (metrics) {
        csvContent += 'PERFORMANCE METRICS\n';
        csvContent += 'Metric,Value\n';
        csvContent += `Total Revenue,${formatCurrency(metrics.totalRevenue)}\n`;
        csvContent += `Estimated Profit,${formatCurrency(metrics.estimatedProfit)}\n`;
        csvContent += `Expiry Risk Loss,${formatCurrency(metrics.expiryRiskLoss)}\n`;
        csvContent += `Dead Stock Value,${formatCurrency(metrics.deadStockValue)}\n\n`;
      }

      // Add Alerts Section
      if (alerts) {
        csvContent += 'ALERTS SUMMARY\n';
        csvContent += 'Alert Type,Count\n';
        csvContent += `Expiry Risk Products,${alerts.expiryRiskProducts?.length || 0}\n`;
        csvContent += `Dead Stock Products,${alerts.deadStockProducts?.length || 0}\n`;
        csvContent += `Low Margin Products,${alerts.lowMarginProducts?.length || 0}\n\n`;
      }

      // Add Top Products Section
      if (topProducts.length > 0) {
        csvContent += 'TOP 10 PROFITABLE PRODUCTS\n';
        csvContent += 'Product Name,Unit Cost,Selling Price,Margin %,Total Profit\n';
        topProducts.forEach(product => {
          const productName = product.productName || '';
          const costPrice = formatCurrency(product.costPrice);
          const price = formatCurrency(product.price);
          const margin = toNumber(product.margin);
          const totalProfit = formatCurrency(product.totalProfit);
          csvContent += `"${productName}",${costPrice},${price},${margin}%,${totalProfit}\n`;
        });
        csvContent += '\n';
      }

      // Add Inventory Data Section
      if (inventoryData.length > 0) {
        csvContent += 'INVENTORY DATA\n';
        csvContent += 'Product Name,Qty,Unit Cost,Selling Price,Expiry Date\n';
        inventoryData.forEach(item => {
          const productName = item.productName || '';
          const quantity = toNumber(item.quantity);
          const costPrice = formatCurrency(item.costPrice);
          const price = formatCurrency(item.price);
          const expiryDate = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A';
          csvContent += `"${productName}",${quantity},${costPrice},${price},${expiryDate}\n`;
        });
        csvContent += '\n';
      }

      // Add Footer
      csvContent += 'FOR ASSISTANCE/ENQUIRIES\n';
      csvContent += 'Contact: support@ppi.com\n';
      csvContent += 'Phone: +233 XXX XXX XXXX\n';
      csvContent += 'Email: info@ppi.com\n';

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `PPI-Report-${new Date().getTime()}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to generate report: ${errorMsg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateReport}
      disabled={isGenerating || (!metrics && !alerts && topProducts.length === 0 && inventoryData.length === 0)}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
        </>
      ) : (!metrics && !alerts && topProducts.length === 0 && inventoryData.length === 0) ? (
        <>
          <Download className="w-4 h-4" />
          No Data
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Download Report
        </>
      )}
    </Button>
  );
}
