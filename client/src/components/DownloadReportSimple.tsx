import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

interface DownloadReportSimpleProps {
  metrics?: any;
  organization?: any;
  selectedBranchName?: string;
  selectedMonth?: string;
  breakdown?: any[];
  insights?: any[];
  totalOverhead?: number;
  overheadData?: any;
}

export default function DownloadReportSimple({
  metrics,
  organization,
  selectedBranchName,
  selectedMonth,
  breakdown = [],
  insights = [],
  totalOverhead = 0,
  overheadData,
}: DownloadReportSimpleProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatCurrency = (value: any): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'GHS 0.00';
    return `GHS ${num.toFixed(2)}`;
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Check if we have any data
      if (!metrics && !organization) {
        toast.error('No data available to export');
        setIsGenerating(false);
        return;
      }

      const grossProfit = metrics?.estimatedProfit || 0;
      const netProfit = grossProfit - totalOverhead;

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
              .footer {
                background: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                border-top: 2px solid #1e40af;
                margin-top: 20px;
              }
              .footer p {
                margin: 5px 0;
                font-size: 12px;
                color: #6b7280;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Pharmacy Performance Report</h1>
              <p>${organization?.name || 'Pharmacy'}</p>
              <p>Branch: ${selectedBranchName || 'All Branches'}</p>
              <p>Report Period: ${selectedMonth || 'N/A'}</p>
              <p>Generated: ${new Date().toLocaleDateString()}</p>
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
              <span class="metric-label">Gross Profit</span>
              <span class="metric-value">${formatCurrency(grossProfit)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Overhead Costs</span>
              <span class="metric-value">${formatCurrency(totalOverhead)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Net Profit</span>
              <span class="metric-value" style="color: ${netProfit < 0 ? '#dc2626' : '#16a34a'}">${formatCurrency(netProfit)}</span>
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

      // Add Overhead Details
      if (overheadData) {
        htmlContent += `
          <div class="section">
            <h2>Overhead Cost Breakdown</h2>
            <div class="metric-row">
              <span class="metric-label">Rent</span>
              <span class="metric-value">${formatCurrency(overheadData.rent)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Salaries</span>
              <span class="metric-value">${formatCurrency(overheadData.salaries)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Electricity</span>
              <span class="metric-value">${formatCurrency(overheadData.electricity)}</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">Others</span>
              <span class="metric-value">${formatCurrency(overheadData.others)}</span>
            </div>
          </div>
        `;
      }

      // Add Branch Breakdown Table
      if (breakdown.length > 0) {
        htmlContent += `
          <div class="section">
            <h2>Branch Performance Comparison</h2>
            <table>
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                  <th>Margin %</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        breakdown.forEach((branch: any) => {
          const revenue = parseFloat(branch.revenue) || 0;
          const profit = parseFloat(branch.profit) || 0;
          const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';
          
          htmlContent += `
                <tr>
                  <td>${branch.branchName}</td>
                  <td>${formatCurrency(revenue)}</td>
                  <td>${formatCurrency(profit)}</td>
                  <td>${margin}%</td>
                </tr>
          `;
        });

        htmlContent += `
              </tbody>
            </table>
          </div>
        `;
      }

      // Add Insights Section
      if (insights.length > 0) {
        htmlContent += `
          <div class="section">
            <h2>Key Insights & Recommendations</h2>
        `;
        
        insights.forEach((insight: any, index: number) => {
          htmlContent += `
            <div class="metric-row">
              <span class="metric-label">${index + 1}. ${insight.title || 'Insight'}</span>
            </div>
            <p style="margin: 5px 0 10px 0; color: #4b5563; font-size: 12px;">${insight.description || insight}</p>
          `;
        });

        htmlContent += `
          </div>
        `;
      }

      // Add Footer
      htmlContent += `
            <div class="footer">
              <p>This report was generated automatically from the Pharmacy Performance Intelligence system.</p>
              <p>For questions or support, please contact your administrator.</p>
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const options: any = {
        margin: 10,
        filename: `pharmacy-report-${selectedMonth || 'report'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      html2pdf().set(options).from(htmlContent).save();
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateReport}
      disabled={isGenerating}
      className="gap-2 bg-green-600 hover:bg-green-700"
    >
      {isGenerating ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download size={18} />
          Download Report
        </>
      )}
    </Button>
  );
}
