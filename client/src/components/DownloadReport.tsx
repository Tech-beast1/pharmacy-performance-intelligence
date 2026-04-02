import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface DownloadReportProps {
  metrics?: any;
  alerts?: any;
  topProducts?: any[];
  inventoryData?: any[];
}

export default function DownloadReport({
  metrics,
  alerts,
  topProducts = [],
  inventoryData = [],
}: DownloadReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCSVReport = () => {
    setIsGenerating(true);
    try {
      const now = new Date().toLocaleDateString();
      
      // Create CSV content
      let csvContent = 'Pharmacy Performance Intelligence - Report\n';
      csvContent += `Generated: ${now}\n\n`;
      
      // Dashboard Metrics
      csvContent += 'DASHBOARD METRICS\n';
      csvContent += '================\n';
      if (metrics) {
        csvContent += `Total Revenue,${metrics.totalRevenue}\n`;
        csvContent += `Revenue Trend (%),${metrics.revenueTrend}\n`;
        csvContent += `Estimated Profit,${metrics.estimatedProfit}\n`;
        csvContent += `Profit Trend (%),${metrics.profitTrend}\n`;
        csvContent += `Expiry Risk Loss,${metrics.expiryRiskLoss}\n`;
        csvContent += `Dead Stock Value,${metrics.deadStockValue}\n`;
      }
      csvContent += '\n\n';

      // Alerts Summary
      csvContent += 'ALERTS SUMMARY\n';
      csvContent += '==============\n';
      if (alerts) {
        csvContent += `Expiry Risk Products,${alerts.expiryRiskProducts?.length || 0}\n`;
        csvContent += `Dead Stock Products,${alerts.deadStockProducts?.length || 0}\n`;
        csvContent += `Low Margin Products,${alerts.lowMarginProducts?.length || 0}\n`;
      }
      csvContent += '\n\n';

      // Top Products
      csvContent += 'TOP 10 PROFITABLE PRODUCTS\n';
      csvContent += '==========================\n';
      csvContent += 'Product Name,Unit Cost,Selling Price,Margin %,Total Profit\n';
      topProducts.forEach(product => {
        csvContent += `"${product.productName}",${product.costPrice || 0},${product.price},${product.margin || 0},${product.totalProfit || 0}\n`;
      });
      csvContent += '\n\n';

      // Inventory Data
      csvContent += 'INVENTORY DATA\n';
      csvContent += '==============\n';
      csvContent += 'Product Name,Quantity,Unit Cost,Selling Price,Expiry Date,Total Sales Qty\n';
      inventoryData.forEach(item => {
        const expiryDate = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A';
        csvContent += `"${item.productName}",${item.quantity},${item.costPrice || 0},${item.price},${expiryDate},${item.totalSalesQuantity || 0}\n`;
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `PPI-Report-${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateCSVReport}
      disabled={isGenerating}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
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
