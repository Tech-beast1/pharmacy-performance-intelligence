import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

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
  revenueChartRef?: React.RefObject<HTMLDivElement>;
  profitChartRef?: React.RefObject<HTMLDivElement>;
  viewMode?: 'single' | 'multi';
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
  revenueChartRef,
  profitChartRef,
  viewMode = 'multi',
}: DownloadReportCleanProps) {
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
      const reportDate = new Date().toLocaleDateString();

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let yPosition = 20;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);

      // Helper function to add a new page if needed
      const checkPageBreak = (spaceNeeded: number) => {
        if (yPosition + spaceNeeded > pageHeight - 10) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      // Header
      pdf.setFillColor(30, 58, 138); // Blue color
      pdf.rect(margin, yPosition - 10, contentWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('Pharmacy Performance Intelligence', pageWidth / 2, yPosition + 5, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Performance Report - ${selectedMonth || reportDate}`, pageWidth / 2, yPosition + 15, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      yPosition += 35;

      // Performance Metrics Section
      pdf.setFontSize(14);
      pdf.setFont(undefined as any, 'bold');
      pdf.text('Performance Metrics', margin, yPosition);
      pdf.setDrawColor(30, 58, 138);
      pdf.line(margin, yPosition + 2, margin + 50, yPosition + 2);
      yPosition += 12;

      pdf.setFont(undefined as any, 'normal');
      pdf.setFontSize(11);
      const metrics_data = [
        ['Total Revenue', formatCurrency(metrics?.totalRevenue || 0)],
        ['Estimated Profit', formatCurrency(netProfit)],
        ['Expiry Risk Loss', formatCurrency(metrics?.expiryRiskLoss || 0)],
        ['Dead Stock Value', formatCurrency(metrics?.deadStockValue || 0)],
      ];

      metrics_data.forEach((row, index) => {
        checkPageBreak(8);
        pdf.text(row[0], margin, yPosition);
        pdf.setTextColor(30, 58, 138);
        pdf.setFont(undefined as any, 'bold');
        pdf.text(row[1], margin + contentWidth - 40, yPosition, { align: 'right' });
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined as any, 'normal');
        yPosition += 8;
      });

      yPosition += 8;

      // Branch Performance Comparison Table - Only show in multi mode
      if (viewMode === 'multi' && breakdown && breakdown.length > 0) {
        checkPageBreak(40);
        pdf.setFontSize(14);
        pdf.setFont(undefined as any, 'bold');
        pdf.text('Branch Performance Comparison', margin, yPosition);
        pdf.setDrawColor(30, 58, 138);
        pdf.line(margin, yPosition + 2, margin + 50, yPosition + 2);
        yPosition += 12;

        // Table headers
        pdf.setFillColor(30, 58, 138);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont(undefined as any, 'bold');
        pdf.setFontSize(10);
        
        const colWidths = [40, 35, 35, 35];
        const headers = ['Branch Name', 'Revenue', 'Profit', 'Margin %'];
        let xPos = margin;
        
        headers.forEach((header, i) => {
          pdf.text(header, xPos + 2, yPosition + 5, { align: 'left' });
          xPos += colWidths[i];
        });

        yPosition += 8;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined as any, 'normal');
        pdf.setFontSize(10);

        // Table rows
        breakdown.forEach((branch: any, index: number) => {
          checkPageBreak(8);
          if (index % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, yPosition - 5, contentWidth, 7, 'F');
          }

          xPos = margin;
          const rowData = [
            (branch.branchName || '') as string,
            formatCurrency(branch.revenue || 0) as string,
            formatCurrency(branch.profit || 0) as string,
            `${branch.marginPercentage?.toFixed(1) || '0.0'}%` as string
          ];

          rowData.forEach((cell, i) => {
            const align = i === 0 ? 'left' : 'right';
            pdf.text(cell, xPos + (align === 'right' ? colWidths[i] - 2 : 2), yPosition, { align });
            xPos += colWidths[i];
          });

          yPosition += 8;
        });

        yPosition += 8;
      }

      // Key Insights Section
      if (insights && insights.length > 0) {
        checkPageBreak(30);
        pdf.setFontSize(14);
        pdf.setFont(undefined as any, 'bold');
        pdf.text('Key Insights', margin, yPosition);
        pdf.setDrawColor(30, 58, 138);
        pdf.line(margin, yPosition + 2, margin + 50, yPosition + 2);
        yPosition += 12;

        pdf.setFont(undefined as any, 'normal');
        pdf.setFontSize(10);

        insights.slice(0, 5).forEach((insight: any) => {
          checkPageBreak(12);
          pdf.setFont(undefined as any, 'bold');
          pdf.text(`• ${insight.title}`, margin + 2, yPosition);
          yPosition += 5;
          
          pdf.setFont(undefined as any, 'normal');
          const descriptionLines = pdf.splitTextToSize(insight.description || '', contentWidth - 4) as string[];
          descriptionLines.forEach((line: string) => {
            checkPageBreak(5);
            pdf.text(line, margin + 4, yPosition);
            yPosition += 4;
          });
          yPosition += 3;
        });

        yPosition += 5;
      }

      // Recommendations Section
      checkPageBreak(40);
      pdf.setFontSize(14);
      pdf.setFont(undefined as any, 'bold');
      pdf.text('Recommendations', margin, yPosition);
      pdf.setDrawColor(30, 58, 138);
      pdf.line(margin, yPosition + 2, margin + 50, yPosition + 2);
      yPosition += 12;

      pdf.setFont(undefined as any, 'normal');
      pdf.setFontSize(10);

      const recommendations = [
        {
          title: 'Focus on Expiry Management',
          description: `You have ${formatCurrency(metrics?.expiryRiskLoss || 0)} worth of products expiring soon. Implement promotional strategies to clear these items.`
        },
        {
          title: 'Optimize Slow-Moving Stock',
          description: `${formatCurrency(metrics?.deadStockValue || 0)} is tied up in products with no recent sales. Consider bundling or discounting these items.`
        },
        {
          title: 'Optimize Branch Performance',
          description: 'Compare branch metrics in the table above to identify top performers and areas for improvement across your network.'
        }
      ];

      recommendations.forEach((rec, index) => {
        checkPageBreak(15);
        pdf.setFont(undefined as any, 'bold');
        pdf.text(`${index + 1}. ${rec.title}`, margin + 2, yPosition);
        yPosition += 5;

        pdf.setFont(undefined as any, 'normal');
        const recLines = pdf.splitTextToSize(rec.description, contentWidth - 4) as string[];
        recLines.forEach((line: string) => {
          checkPageBreak(4);
          pdf.text(line, margin + 4, yPosition);
          yPosition += 4;
        });
        yPosition += 4;
      });

      // Footer
      yPosition = pageHeight - 15;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text('For Assistance or Enquiries: salomeydenkyira@gmail.com | 0240373436', pageWidth / 2, yPosition, { align: 'center' });
      pdf.text('Pharmacy Performance Intelligence System', pageWidth / 2, yPosition + 5, { align: 'center' });

      // Save PDF
      pdf.save(`pharmacy-report-${selectedMonth || 'report'}.pdf`);
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
