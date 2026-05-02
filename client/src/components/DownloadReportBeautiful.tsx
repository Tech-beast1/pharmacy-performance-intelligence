import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

interface DownloadReportBeautifulProps {
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

export default function DownloadReportBeautiful({
  metrics,
  organization,
  selectedBranchName,
  selectedMonth,
  breakdown = [],
  insights = [],
  totalOverhead = 0,
  overheadData,
  alertCounts,
}: DownloadReportBeautifulProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatCurrency = (value: any): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'GHS 0.00';
    return `GHS ${num.toFixed(2)}`;
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
      const expiryRiskCount = alertCounts?.expiryRisk || 0;
      const deadStockCount = alertCounts?.deadStock || 0;
      const lowMarginCount = alertCounts?.lowMargin || 0;

      // Create HTML content that mirrors the dashboard
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
                background-color: #f9fafb;
                padding: 20px;
                line-height: 1.6;
              }

              .page-break {
                page-break-after: always;
              }

              /* Header Section */
              .header {
                background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
                color: white;
                padding: 40px;
                border-radius: 12px;
                margin-bottom: 30px;
                text-align: center;
              }

              .header h1 {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 10px;
              }

              .header p {
                font-size: 16px;
                opacity: 0.95;
                margin: 5px 0;
              }

              .header-meta {
                font-size: 14px;
                opacity: 0.85;
                margin-top: 15px;
                border-top: 1px solid rgba(255,255,255,0.2);
                padding-top: 15px;
              }

              /* Metrics Grid */
              .metrics-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 30px;
              }

              .metric-card {
                background: white;
                padding: 25px;
                border-radius: 10px;
                border-left: 4px solid #1e40af;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }

              .metric-card.profit {
                border-left-color: #16a34a;
              }

              .metric-card.risk {
                border-left-color: #dc2626;
              }

              .metric-card.warning {
                border-left-color: #ea580c;
              }

              .metric-label {
                font-size: 12px;
                color: #6b7280;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
              }

              .metric-value {
                font-size: 28px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 5px;
              }

              .metric-subtext {
                font-size: 12px;
                color: #9ca3af;
              }

              /* Alert Cards */
              .alerts-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 30px;
              }

              .alert-card {
                background: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                border-top: 3px solid #dc2626;
              }

              .alert-card.warning {
                border-top-color: #ea580c;
              }

              .alert-card.info {
                border-top-color: #0ea5e9;
              }

              .alert-icon {
                font-size: 24px;
                margin-bottom: 10px;
              }

              .alert-count {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 5px;
              }

              .alert-label {
                font-size: 12px;
                color: #6b7280;
                font-weight: 600;
              }

              /* Section */
              .section {
                background: white;
                padding: 25px;
                margin-bottom: 25px;
                border-radius: 10px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }

              .section h2 {
                font-size: 18px;
                font-weight: 700;
                color: #1e40af;
                margin-bottom: 20px;
                padding-bottom: 12px;
                border-bottom: 2px solid #e5e7eb;
              }

              /* Overhead Breakdown */
              .overhead-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
              }

              .overhead-item {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #f3f4f6;
              }

              .overhead-item:last-child {
                border-bottom: none;
              }

              .overhead-label {
                font-weight: 600;
                color: #374151;
              }

              .overhead-value {
                color: #1e40af;
                font-weight: 700;
              }

              /* Table */
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
              }

              thead {
                background-color: #f3f4f6;
              }

              th {
                padding: 12px;
                text-align: left;
                font-weight: 700;
                color: #1e40af;
                font-size: 13px;
                border-bottom: 2px solid #1e40af;
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

              /* Insights */
              .insights-list {
                list-style: none;
              }

              .insight-item {
                padding: 15px 0;
                border-bottom: 1px solid #e5e7eb;
              }

              .insight-item:last-child {
                border-bottom: none;
              }

              .insight-title {
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 5px;
                font-size: 14px;
              }

              .insight-description {
                color: #6b7280;
                font-size: 13px;
                line-height: 1.5;
              }

              /* Footer */
              .footer {
                background: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                border-top: 2px solid #e5e7eb;
                margin-top: 30px;
                font-size: 12px;
                color: #6b7280;
              }

              .footer p {
                margin: 5px 0;
              }

              /* Page Number */
              .page-number {
                text-align: center;
                font-size: 11px;
                color: #9ca3af;
                margin-top: 20px;
              }

              @media print {
                body {
                  background-color: white;
                }
                .page-break {
                  page-break-after: always;
                }
              }
            </style>
          </head>
          <body>
            <!-- Header -->
            <div class="header">
              <h1>Pharmacy Performance Report</h1>
              <p style="font-size: 18px; margin-top: 10px;">${organization?.name || 'Pharmacy'}</p>
              <div class="header-meta">
                <p>Branch: ${selectedBranchName || 'All Branches'}</p>
                <p>Report Period: ${selectedMonth || 'N/A'}</p>
                <p>Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            <!-- Metrics Grid -->
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">💰 Total Revenue</div>
                <div class="metric-value">${formatCurrency(metrics?.totalRevenue || 0)}</div>
              </div>
              <div class="metric-card profit">
                <div class="metric-label">📈 Estimated Profit</div>
                <div class="metric-value">${formatCurrency(netProfit)}</div>
                <div class="metric-subtext">Gross: ${formatCurrency(grossProfit)}</div>
              </div>
              <div class="metric-card risk">
                <div class="metric-label">⚠️ Expiry Risk Loss</div>
                <div class="metric-value">${formatCurrency(metrics?.expiryRiskLoss || 0)}</div>
              </div>
              <div class="metric-card warning">
                <div class="metric-label">📦 Dead Stock Value</div>
                <div class="metric-value">${formatCurrency(metrics?.deadStockValue || 0)}</div>
              </div>
            </div>

            <!-- Alert Cards -->
            <div class="alerts-grid">
              <div class="alert-card">
                <div class="alert-icon">⚠️</div>
                <div class="alert-count">${expiryRiskCount}</div>
                <div class="alert-label">Products Expiring Soon</div>
              </div>
              <div class="alert-card warning">
                <div class="alert-icon">📦</div>
                <div class="alert-count">${deadStockCount}</div>
                <div class="alert-label">No Sales in 60 Days</div>
              </div>
              <div class="alert-card info">
                <div class="alert-icon">💹</div>
                <div class="alert-count">${lowMarginCount}</div>
                <div class="alert-label">Margin Below 20%</div>
              </div>
            </div>

            <!-- Overhead Costs -->
            <div class="section">
              <h2>💼 Overhead Cost Breakdown</h2>
              <div class="overhead-grid">
                <div class="overhead-item">
                  <span class="overhead-label">Rent</span>
                  <span class="overhead-value">${formatCurrency(overheadData?.rent || 0)}</span>
                </div>
                <div class="overhead-item">
                  <span class="overhead-label">Salaries</span>
                  <span class="overhead-value">${formatCurrency(overheadData?.salaries || 0)}</span>
                </div>
                <div class="overhead-item">
                  <span class="overhead-label">Electricity</span>
                  <span class="overhead-value">${formatCurrency(overheadData?.electricity || 0)}</span>
                </div>
                <div class="overhead-item">
                  <span class="overhead-label">Others</span>
                  <span class="overhead-value">${formatCurrency(overheadData?.others || 0)}</span>
                </div>
              </div>
              <div class="overhead-item" style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #1e40af; font-weight: 700;">
                <span class="overhead-label">Total Overhead</span>
                <span class="overhead-value">${formatCurrency(totalOverhead)}</span>
              </div>
            </div>

            <!-- Branch Performance -->
            ${breakdown.length > 0 ? `
            <div class="section">
              <h2>🏢 Branch Performance Comparison</h2>
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
                  ${breakdown.map((branch: any) => {
                    const revenue = parseFloat(branch.revenue) || 0;
                    const profit = parseFloat(branch.profit) || 0;
                    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';
                    return `
                    <tr>
                      <td><strong>${branch.branchName}</strong></td>
                      <td>${formatCurrency(revenue)}</td>
                      <td>${formatCurrency(profit)}</td>
                      <td>${margin}%</td>
                    </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <!-- Key Insights -->
            ${insights.length > 0 ? `
            <div class="section">
              <h2>💡 Key Insights & Recommendations</h2>
              <ul class="insights-list">
                ${insights.map((insight: any, index: number) => `
                <li class="insight-item">
                  <div class="insight-title">${index + 1}. ${insight.title || insight}</div>
                  <div class="insight-description">${insight.description || ''}</div>
                </li>
                `).join('')}
              </ul>
            </div>
            ` : ''}

            <!-- Footer -->
            <div class="footer">
              <p>This report was generated from the Pharmacy Performance Intelligence System</p>
              <p>For support, contact your administrator</p>
              <div class="page-number">Page 1</div>
            </div>
          </body>
        </html>
      `;

      // Generate PDF with better options
      const options: any = {
        margin: 10,
        filename: `pharmacy-report-${selectedMonth || 'report'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      html2pdf().set(options).from(htmlContent).save();
      toast.success('Beautiful PDF report downloaded!');
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
