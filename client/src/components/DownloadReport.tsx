import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

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

// Determine status based on inventory item
const getInventoryStatus = (item: any, alerts: any): string => {
  if (!alerts) return 'Normal';
  
  const productName = item.productName?.toLowerCase().trim() || '';
  
  // Debug: Log alerts structure once
  if (!(window as any).__alertsLogged) {
    console.log('[PDF Debug] Full alerts object:', alerts);
    console.log('[PDF Debug] Expiry Risk count:', alerts.expiryRiskProducts?.length || 0);
    console.log('[PDF Debug] Dead Stock count:', alerts.deadStockProducts?.length || 0);
    console.log('[PDF Debug] Low Margin count:', alerts.lowMarginProducts?.length || 0);
    (window as any).__alertsLogged = true;
  }
  
  // Check expiryRiskProducts array
  if (alerts.expiryRiskProducts?.length > 0) {
    const found = alerts.expiryRiskProducts.find((p: any) => {
      const pName = (p.productName || p.name)?.toLowerCase().trim() || '';
      return pName === productName;
    });
    if (found) return 'Expiry Risk';
  }
  
  // Check deadStockProducts array
  if (alerts.deadStockProducts?.length > 0) {
    const found = alerts.deadStockProducts.find((p: any) => {
      const pName = (p.productName || p.name)?.toLowerCase().trim() || '';
      return pName === productName;
    });
    if (found) return 'Dead Stock';
  }
  
  // Check lowMarginProducts array
  if (alerts.lowMarginProducts?.length > 0) {
    const found = alerts.lowMarginProducts.find((p: any) => {
      const pName = (p.productName || p.name)?.toLowerCase().trim() || '';
      return pName === productName;
    });
    if (found) return 'Low Margin';
  }
  
  return 'Normal';
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

      // PPI Logo URL
      const PPILogoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663468724713/S4YkwNcqjTUWGj5JFbbkiz/ppi-logo_adfa0f9c.png';

      // Create HTML content for PDF
      let htmlContent = `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
              }
              .header {
                background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
                color: white;
                padding: 30px;
                border-radius: 8px;
                margin-bottom: 30px;
              }
              .header-content {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
              }
              .header-logo {
                width: 100px;
                height: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
              }
              .header-logo img {
                width: 100%;
                height: 100%;
                object-fit: contain;
              }
              .header-text {
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
              }
              .header p {
                margin: 5px 0 0 0;
                font-size: 14px;
                opacity: 0.9;
              }
              .section {
                margin-bottom: 30px;
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              .section h2 {
                color: #1e40af;
                font-size: 18px;
                margin-top: 0;
                border-bottom: 2px solid #1e40af;
                padding-bottom: 10px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }
              th, td {
                padding: 10px;
                text-align: left;
                border-bottom: 1px solid #e5e7eb;
              }
              th {
                background-color: #f3f4f6;
                font-weight: bold;
                color: #1e40af;
              }
              tr:hover {
                background-color: #f9fafb;
              }
              .metric-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .metric-label {
                font-weight: bold;
                color: #374151;
              }
              .metric-value {
                color: #1e40af;
                font-weight: bold;
              }
              .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                text-align: center;
              }
              .status-dead-stock {
                background-color: #fed7aa;
                color: #92400e;
              }
              .status-expiry-risk {
                background-color: #fecaca;
                color: #991b1b;
              }
              .status-low-margin {
                background-color: #fef3c7;
                color: #92400e;
              }
              .status-ok {
                color: #6b7280;
                font-weight: 500;
              }
              .footer {
                background: #f3f4f6;
                padding: 20px;
                border-radius: 8px;
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
              }
              .footer h3 {
                color: #1e40af;
                margin-top: 0;
              }
              .footer p {
                margin: 5px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-content">
                <div class="header-logo">
                  <img src="${PPILogoUrl}" alt="PPI Logo" />
                </div>
                <div class="header-text">
                  <h1>Pharmacy Performance Intelligence</h1>
                  <p>Performance Report - ${new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
      `;

      // Add Metrics Section
      if (metrics) {
        htmlContent += `
          <div class="section">
            <h2>Performance Metrics</h2>
            <div class="metric-row">
              <span class="metric-label">Total Revenue</span>
              <span class="metric-value">${formatCurrency(metrics.totalRevenue)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Estimated Profit</span>
              <span class="metric-value">${formatCurrency(metrics.estimatedProfit)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Expiry Risk Loss</span>
              <span class="metric-value">${formatCurrency(metrics.expiryRiskLoss)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Dead Stock Value</span>
              <span class="metric-value">${formatCurrency(metrics.deadStockValue)}</span>
            </div>
          </div>
        `;
      }

      // Add Alerts Section
      if (alerts) {
        htmlContent += `
          <div class="section">
            <h2>Alerts Summary</h2>
            <table>
              <tr>
                <th>Alert Type</th>
                <th>Count</th>
              </tr>
              <tr>
                <td>Expiry Risk Products</td>
                <td>${alerts.expiryRiskProducts?.length || 0}</td>
              </tr>
              <tr>
                <td>Dead Stock Products</td>
                <td>${alerts.deadStockProducts?.length || 0}</td>
              </tr>
              <tr>
                <td>Low Margin Products</td>
                <td>${alerts.lowMarginProducts?.length || 0}</td>
              </tr>
            </table>
          </div>
        `;
      }

      // Add Top Products Section
      if (topProducts.length > 0) {
        htmlContent += `
          <div class="section">
            <h2>Top 10 Profitable Products</h2>
            <table>
              <tr>
                <th>Product Name</th>
                <th>Unit Cost</th>
                <th>Selling Price</th>
                <th>Total Profit</th>
              </tr>
        `;
        topProducts.forEach(product => {
          htmlContent += `
            <tr>
              <td>${product.productName || ''}</td>
              <td>${formatCurrency(product.costPrice)}</td>
              <td>${formatCurrency(product.price)}</td>
              <td>${formatCurrency(product.totalProfit)}</td>
            </tr>
          `;
        });
        htmlContent += `
            </table>
          </div>
        `;
      }

      // Add Inventory Data Section
      if (inventoryData.length > 0) {
        htmlContent += `
          <div class="section">
            <h2>Inventory Data</h2>
            <table>
              <tr>
                <th>Product Name</th>
                <th>Qty</th>
                <th>Unit Cost</th>
                <th>Selling Price</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
        `;
        inventoryData.forEach(item => {
          const expiryDate = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A';
          const status = getInventoryStatus(item, alerts);
          let statusHtml = '';
          if (status === 'Dead Stock') {
            statusHtml = '<span class="status-badge status-dead-stock">Dead Stock</span>';
          } else if (status === 'Expiry Risk') {
            statusHtml = '<span class="status-badge status-expiry-risk">Expiry Risk</span>';
          } else if (status === 'Low Margin') {
            statusHtml = '<span class="status-badge status-low-margin">Low Margin</span>';
          } else {
            statusHtml = '<span class="status-ok">OK</span>';
          }
          htmlContent += `
            <tr>
              <td>${item.productName || ''}</td>
              <td>${toNumber(item.quantity)}</td>
              <td>${formatCurrency(item.costPrice)}</td>
              <td>${formatCurrency(item.price)}</td>
              <td>${expiryDate}</td>
              <td>${statusHtml}</td>
            </tr>
          `;
        });
        htmlContent += `
            </table>
          </div>
        `;
      }

      // Add Footer
      htmlContent += `
            <div class="footer">
              <h3>For Assistance/Enquiries</h3>
              <p>Email: salomeydenkyira@gmail.com</p>
              <p>Phone: 0240373436</p>
              <p style="margin-top: 15px; border-top: 1px solid #d1d5db; padding-top: 10px;">
                Pharmacy Performance Intelligence v1.0.0
              </p>
            </div>
          </body>
        </html>
      `;

      // Create PDF from HTML
      const element = document.createElement('div');
      element.innerHTML = htmlContent;

      const opt = {
        margin: 10,
        filename: `PPI-Report-${new Date().getTime()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      (html2pdf() as any).set(opt).from(element).save();

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
