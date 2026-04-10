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

export default function DownloadReport({
  metrics,
  alerts,
  topProducts = [],
  inventoryData = [],
}: DownloadReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDFReport = async () => {
    setIsGenerating(true);
    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 10;

      // Add header with logo and title
      doc.setFillColor(30, 96, 242); // Blue background
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Add title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Pharmacy Performance Intelligence', 15, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Performance Report', 15, 28);

      // Add date
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 50);

      yPosition = 60;

      // Dashboard Metrics Section
      if (metrics) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Performance Metrics', 10, yPosition);
        yPosition += 8;

        const metricsData = [
          ['Total Revenue', `₵${(metrics.totalRevenue || 0).toFixed(2)}`],
          ['Estimated Profit', `₵${(metrics.estimatedProfit || 0).toFixed(2)}`],
          ['Expiry Risk Loss', `₵${(metrics.expiryRiskLoss || 0).toFixed(2)}`],
          ['Dead Stock Value', `₵${(metrics.deadStockValue || 0).toFixed(2)}`],
        ];

        (doc as any).autoTable({
          startY: yPosition,
          head: [['Metric', 'Value']],
          body: metricsData,
          theme: 'grid',
          headStyles: { fillColor: [30, 96, 242], textColor: 255 },
          columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80 } },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Alerts Summary Section
      if (alerts) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Alerts Summary', 10, yPosition);
        yPosition += 8;

        const alertsData = [
          ['Expiry Risk Products', (alerts.expiryRiskProducts?.length || 0).toString()],
          ['Dead Stock Products', (alerts.deadStockProducts?.length || 0).toString()],
          ['Low Margin Products', (alerts.lowMarginProducts?.length || 0).toString()],
        ];

        (doc as any).autoTable({
          startY: yPosition,
          head: [['Alert Type', 'Count']],
          body: alertsData,
          theme: 'grid',
          headStyles: { fillColor: [30, 96, 242], textColor: 255 },
          columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80 } },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Top Products Section
      if (topProducts.length > 0) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 10;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Top 10 Profitable Products', 10, yPosition);
        yPosition += 8;

        const productsData = topProducts.map(product => [
          product.productName || '',
          `₵${(product.costPrice || 0).toFixed(2)}`,
          `₵${(product.price || 0).toFixed(2)}`,
          `${product.margin || 0}%`,
          `₵${(product.totalProfit || 0).toFixed(2)}`,
        ]);

        (doc as any).autoTable({
          startY: yPosition,
          head: [['Product Name', 'Unit Cost', 'Selling Price', 'Margin %', 'Total Profit']],
          body: productsData,
          theme: 'grid',
          headStyles: { fillColor: [30, 96, 242], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 30 },
            2: { cellWidth: 30 },
            3: { cellWidth: 25 },
            4: { cellWidth: 30 },
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Inventory Data Section
      if (inventoryData.length > 0) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 10;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Inventory Data', 10, yPosition);
        yPosition += 8;

        const inventoryTableData = inventoryData.map(item => [
          item.productName || '',
          (item.quantity || 0).toString(),
          `₵${(item.costPrice || 0).toFixed(2)}`,
          `₵${(item.price || 0).toFixed(2)}`,
          item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
          (item.totalSalesQuantity || 0).toString(),
        ]);

        (doc as any).autoTable({
          startY: yPosition,
          head: [['Product Name', 'Qty', 'Unit Cost', 'Selling Price', 'Expiry Date', 'Sales Qty']],
          body: inventoryTableData,
          theme: 'grid',
          headStyles: { fillColor: [30, 96, 242], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 45 },
            1: { cellWidth: 20 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 30 },
            5: { cellWidth: 20 },
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Add footer with contact information on last page
      const footerY = pageHeight - 20;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'bold');
      doc.text('For Assistance/Enquiries', 10, footerY);
      doc.setFont('helvetica', 'normal');
      doc.text('Contact: support@ppi.com | Phone: +233 XXX XXX XXXX', 10, footerY + 5);
      doc.text('Email: info@ppi.com', 10, footerY + 10);

      // Save PDF
      doc.save(`PPI-Report-${new Date().getTime()}.pdf`);
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDFReport}
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
