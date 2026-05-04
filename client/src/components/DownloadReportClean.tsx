import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

// Helper function to draw simple pie charts
const drawSimplePieChart = (ctx: CanvasRenderingContext2D, data: any[], title: string) => {
  const centerX = ctx.canvas.width / 2;
  const centerY = ctx.canvas.height / 2;
  const radius = 80;
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

  // Draw title
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText(title, centerX, 20);

  // Calculate total
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return;

  // Draw pie slices
  let currentAngle = -Math.PI / 2;
  data.forEach((item, index) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    
    // Draw slice
    ctx.fillStyle = colors[index % colors.length];
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw label outside the circle
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelDistance = radius + 30;
    const labelX = centerX + Math.cos(labelAngle) * labelDistance;
    const labelY = centerY + Math.sin(labelAngle) * labelDistance;
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    const percentage = ((item.value / total) * 100).toFixed(1);
    ctx.fillText(`${percentage}%`, labelX, labelY);
    
    // Draw line from circle to label
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(labelAngle) * radius, centerY + Math.sin(labelAngle) * radius);
    ctx.lineTo(labelX, labelY);
    ctx.stroke();

    currentAngle += sliceAngle;
  });

  // Draw legend
  ctx.font = '11px Arial';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  let legendY = 180;
  data.forEach((item, index) => {
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(10, legendY - 8, 12, 12);
    ctx.fillStyle = '#333';
    ctx.fillText(`${item.name}: ₵${item.value.toFixed(2)}`, 25, legendY);
    legendY += 15;
  });
};

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

      // Pie Charts Section (only in multi mode with breakdown data)
      if (viewMode === 'multi' && breakdown && breakdown.length > 1) {
        checkPageBreak(100);
        pdf.setFontSize(14);
        pdf.setFont(undefined as any, 'bold');
        pdf.text('Branch Distribution Charts', margin, yPosition);
        pdf.setDrawColor(30, 58, 138);
        pdf.line(margin, yPosition + 2, margin + 50, yPosition + 2);
        yPosition += 12;

        // Create pie chart data
        const revenueData = breakdown.map((branch: any) => ({
          name: branch.branchName,
          value: parseFloat(branch.revenue) || 0,
        }));
        const profitData = breakdown.map((branch: any) => ({
          name: branch.branchName,
          value: parseFloat(branch.profit) || 0,
        }));

        // Add pie chart images using canvas
        const canvas1 = document.createElement('canvas');
        const ctx1 = canvas1.getContext('2d');
        if (ctx1) {
          canvas1.width = 300;
          canvas1.height = 250;
          drawSimplePieChart(ctx1, revenueData, 'Revenue Distribution');
          const imgData1 = canvas1.toDataURL('image/png');
          pdf.addImage(imgData1, 'PNG', margin, yPosition, 80, 65);
        }

        const canvas2 = document.createElement('canvas');
        const ctx2 = canvas2.getContext('2d');
        if (ctx2) {
          canvas2.width = 300;
          canvas2.height = 250;
          drawSimplePieChart(ctx2, profitData, 'Profit Distribution');
          const imgData2 = canvas2.toDataURL('image/png');
          pdf.addImage(imgData2, 'PNG', margin + 95, yPosition, 80, 65);
        }

        yPosition += 75;
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
