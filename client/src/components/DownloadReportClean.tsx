import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

interface DownloadReportCleanProps {
  metrics?: any;
  organization?: any;
  selectedBranchName?: string;
  selectedMonth?: string;
  breakdown?: any[];
  insights?: any[];
  totalOverhead?: number;
  overheadData?: any;
  alertCounts?: any;
}

export default function DownloadReportClean({
  metrics,
  organization,
  selectedBranchName,
  selectedMonth,
  breakdown = [],
  insights = [],
  totalOverhead = 0,
  overheadData,
  alertCounts,
}: DownloadReportCleanProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatCurrency = (value: any): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '₵0.00';
    return `₵${num.toFixed(2)}`;
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      if (!metrics && !organization) {
        toast.error('No data available to export');
        setIsGenerating(false);
        return;
      }

      const grossProfit = metrics?.estimatedProfit || 0;
      const netProfit = grossProfit - totalOverhead;
      const reportDate = new Date().toLocaleDateString();

      // Create HTML content in clean format
      let htmlContent = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #f5f5f5;
                padding: 40px;
                line-height: 1.6;
              }

              .container {
                max-width: 900px;
                margin: 0 auto;
                background: white;
                padding: 40px;
              }

              /* Header */
              .header {
                background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                color: white;
                padding: 30px;
                border-radius: 8px;
                margin-bottom: 40px;
                text-align: center;
              }

              .header h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
              }

              .header p {
                font-size: 14px;
                opacity: 0.95;
              }

              /* Section */
              .section {
                margin-bottom: 40px;
              }

              .section h2 {
                font-size: 16px;
                font-weight: 700;
                color: #1e3a8a;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #1e3a8a;
              }

              /* Metrics */
              .metrics-list {
                list-style: none;
              }

              .metric-item {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #e5e7eb;
                font-size: 14px;
              }

              .metric-item:last-child {
                border-bottom: none;
              }

              .metric-label {
                font-weight: 600;
                color: #1f2937;
              }

              .metric-value {
                color: #1e3a8a;
                font-weight: 700;
              }

              /* Table */
              table {
                width: 100%;
                border-collapse: collapse;
              }

              thead {
                background-color: #f9fafb;
              }

              th {
                padding: 12px;
                text-align: left;
                font-weight: 700;
                color: #1e3a8a;
                font-size: 13px;
                border-bottom: 2px solid #1e3a8a;
              }

              td {
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 13px;
              }

              tr:last-child td {
                border-bottom: none;
              }

              tbody tr:hover {
                background-color: #f9fafb;
              }

              /* Footer */
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
              }

              @media print {
                body {
                  background-color: white;
                  padding: 0;
                }
                .container {
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <!-- Header -->
              <div class="header">
                <h1>Pharmacy Performance Intelligence</h1>
                <p>Performance Report - ${selectedMonth || reportDate}</p>
              </div>

              <!-- Performance Metrics -->
              <div class="section">
                <h2>Performance Metrics</h2>
                <ul class="metrics-list">
                  <li class="metric-item">
                    <span class="metric-label">Total Revenue</span>
                    <span class="metric-value">${formatCurrency(metrics?.totalRevenue || 0)}</span>
                  </li>
                  <li class="metric-item">
                    <span class="metric-label">Estimated Profit</span>
                    <span class="metric-value">${formatCurrency(netProfit)}</span>
                  </li>
                  <li class="metric-item">
                    <span class="metric-label">Expiry Risk Loss</span>
                    <span class="metric-value">${formatCurrency(metrics?.expiryRiskLoss || 0)}</span>
                  </li>
                  <li class="metric-item">
                    <span class="metric-label">Dead Stock Value</span>
                    <span class="metric-value">${formatCurrency(metrics?.deadStockValue || 0)}</span>
                  </li>
                </ul>
              </div>

              <!-- Key Insights -->
              ${insights.length > 0 ? `
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
                    ${insights.map((insight: any) => `
                    <tr>
                      <td><strong>${insight.title || 'Insight'}</strong></td>
                      <td>${insight.description || ''}</td>
                    </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ` : ''}

              <!-- Footer -->
              <div class="footer">
                <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                <p>Pharmacy Performance Intelligence System</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const options: any = {
        margin: 10,
        filename: `pharmacy-report-${selectedMonth || 'report'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
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
