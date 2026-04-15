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
  insights?: any[];
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

// Format date consistently without timezone conversion
const formatDate = (dateValue: any): string => {
  if (!dateValue) return 'N/A';
  
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
    
    return 'N/A';
  } catch (error) {
    return 'N/A';
  }
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
  insights = [],
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

      // Professional SVG Logo for PDF - Pharmacy Performance
      const logoSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1e40af;stop-opacity:1"/><stop offset="100%" style="stop-color:#2563eb;stop-opacity:1"/></linearGradient></defs><circle cx="100" cy="100" r="95" fill="url(#grad)"/><g transform="translate(100,100)"><path d="M -20,-30 L 0,-50 L 20,-30 L 10,-30 L 10,20 L -10,20 L -10,-30 Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="40" r="6" fill="white"/><circle cx="-15" cy="40" r="6" fill="white"/><circle cx="15" cy="40" r="6" fill="white"/></g></svg>';
      const logoDataUrl = 'data:image/svg+xml;base64,' + btoa(logoSVG);

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
                background: white;
                padding: 20px;
                margin-bottom: 20px;
                border-radius: 8px;
                page-break-inside: avoid;
              }
              .section h2 {
                margin: 0 0 15px 0;
                color: #1e40af;
                font-size: 18px;
                border-bottom: 2px solid #1e40af;
                padding-bottom: 10px;
              }
              .metric-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .metric-row:last-child {
                border-bottom: none;
              }
              .metric-label {
                font-weight: 600;
                color: #374151;
              }
              .metric-value {
                color: #1e40af;
                font-weight: bold;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 11px;
              }
              th {
                background-color: #f3f4f6;
                padding: 12px;
                text-align: left;
                font-weight: 600;
                color: #1e40af;
                border-bottom: 2px solid #1e40af;
              }
              td {
                padding: 10px 12px;
                border-bottom: 1px solid #e5e7eb;
              }
              tr:last-child td {
                border-bottom: none;
              }
              .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
              }
              .status-expiry {
                background-color: #fecaca;
                color: #7f1d1d;
              }
              .status-deadstock {
                background-color: #fed7aa;
                color: #7c2d12;
              }
              .status-lowmargin {
                background-color: #fef3c7;
                color: #78350f;
              }
              .status-normal {
                color: #6b7280;
              }
              .footer {
                background: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                border-top: 2px solid #1e40af;
              }
              .footer h3 {
                margin: 0 0 10px 0;
                color: #1e40af;
              }
              .footer p {
                margin: 5px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-content">
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
              <span class="metric-value" style="color: ${toNumber(metrics.estimatedProfit) < 0 ? '#dc2626' : 'inherit'}">${formatCurrency(metrics.estimatedProfit)}</span>
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

      // Add Key Insights Section
      if (insights && insights.length > 0) {
        htmlContent += `
          <div class="section">
            <h2>Key Insights</h2>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
        `;
        insights.forEach((insight: any) => {
          htmlContent += `
                <tr>
                  <td>${insight.title || 'N/A'}</td>
                  <td>${insight.description || 'N/A'}</td>
                </tr>
          `;
        });
        htmlContent += `
              </tbody>
            </table>
          </div>
        `;
      }

      // Add Alerts Section
      if (alerts) {
        htmlContent += `
          <div class="section">
            <h2>Alerts Summary</h2>
            <table>
              <thead>
                <tr>
                  <th>Alert Type</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Expiry Risk</td>
                  <td>${alerts.expiryRiskProducts?.length || 0}</td>
                </tr>
                <tr>
                  <td>Dead Stock</td>
                  <td>${alerts.deadStockProducts?.length || 0}</td>
                </tr>
                <tr>
                  <td>Low Margin</td>
                  <td>${alerts.lowMarginProducts?.length || 0}</td>
                </tr>
              </tbody>
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
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Unit Cost</th>
                  <th>Selling Price</th>
                  <th>Quantity</th>
                  <th>Total Profit</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        topProducts.forEach((product: any) => {
          htmlContent += `
                <tr>
                  <td>${product.productName || 'N/A'}</td>
                  <td>${formatCurrency(product.costPrice)}</td>
                  <td>${formatCurrency(product.price)}</td>
                  <td>${product.quantity || 0}</td>
                  <td>${formatCurrency(product.totalProfit)}</td>
                </tr>
          `;
        });

        htmlContent += `
              </tbody>
            </table>
          </div>
        `;
      }

      // Add Inventory Section
      if (inventoryData.length > 0) {
        htmlContent += `
          <div class="section">
            <h2>Inventory Data</h2>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Selling Price</th>
                  <th>Expiry Date</th>
                  <th>Dead Stock Value</th>
                  <th>Expiry Risk Loss</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
        `;

        inventoryData.forEach((item: any) => {
          const status = getInventoryStatus(item, alerts);
          let statusClass = 'status-normal';
          if (status === 'Expiry Risk') statusClass = 'status-expiry';
          else if (status === 'Dead Stock') statusClass = 'status-deadstock';
          else if (status === 'Low Margin') statusClass = 'status-lowmargin';

          // Check if item is dead stock
          const isDeadStock = alerts?.deadStockProducts?.some((p: any) => 
            (p.productName || p.name)?.toLowerCase().trim() === (item.productName || '')?.toLowerCase().trim()
          ) || false;

          // Check if item has expiry risk
          const hasExpiryRisk = alerts?.expiryRiskProducts?.some((p: any) => 
            (p.productName || p.name)?.toLowerCase().trim() === (item.productName || '')?.toLowerCase().trim()
          ) || false;

          // Calculate dead stock value
          const deadStockValue = isDeadStock ? toNumber(item.quantity) * toNumber(item.costPrice) : 0;
          
          // Calculate expiry risk loss
          const expiryRiskLoss = hasExpiryRisk ? toNumber(item.quantity) * toNumber(item.costPrice) : 0;

          htmlContent += `
                <tr>
                  <td>${item.productName || 'N/A'}</td>
                  <td>${item.quantity || 0}</td>
                  <td>${formatCurrency(item.costPrice)}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatDate(item.expiryDate)}</td>
                  <td>${formatCurrency(deadStockValue)}</td>
                  <td>${formatCurrency(expiryRiskLoss)}</td>
                  <td><span class="status-badge ${statusClass}">${status}</span></td>
                </tr>
          `;
        });

        htmlContent += `
              </tbody>
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
              <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">Pharmacy Performance Intelligence v1.0.0</p>
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const element = document.createElement('div');
      element.innerHTML = htmlContent;

      const opt = {
        margin: 10,
        filename: 'pharmacy-performance-report.pdf',
        image: { type: 'jpeg' as any, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' as any, unit: 'mm' as any, format: 'a4' },
      };

      html2pdf().set(opt).from(element).save();
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateReport}
      disabled={isGenerating}
      className="gap-2 bg-green-600 hover:bg-green-700 text-white"
      size="sm"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Download Report
        </>
      )}
    </Button>
  );
}
