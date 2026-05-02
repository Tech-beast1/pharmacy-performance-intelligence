import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  profile: any;
  metrics: any;
  alerts: any;
  insights: any;
  overheadCosts: any;
  month: number;
  year: number;
  branchId?: number;
  branches: any[];
  inventoryCount: number;
  salesCount: number;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatCurrency = (value: number): string => {
  return `₵${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const generatePDF = (data: ReportData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Set colors
  const primaryColor = [25, 103, 210]; // Blue
  const textColor = [0, 0, 0];
  const lightGray = [240, 240, 240];

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('Pharmacy Performance Report', 20, 25);
  
  // Pharmacy Info
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  yPosition = 50;
  
  if (data.profile) {
    doc.text(`Pharmacy: ${data.profile.pharmacyName}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Owner: ${data.profile.ownerName}`, 20, yPosition);
    yPosition += 6;
    if (data.profile.location) {
      doc.text(`Location: ${data.profile.location}`, 20, yPosition);
      yPosition += 6;
    }
  }
  
  doc.text(`Report Period: ${monthNames[data.month - 1]} ${data.year}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
  yPosition += 12;

  // Key Metrics Section
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Key Metrics', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  const metricsData = [
    ['Metric', 'Value'],
    ['Total Revenue', formatCurrency(data.metrics.totalRevenue || 0)],
    ['Gross Profit', formatCurrency(data.metrics.grossProfit || 0)],
    ['Overhead Costs', formatCurrency((data.overheadCosts?.rent || 0) + (data.overheadCosts?.salaries || 0) + (data.overheadCosts?.electricity || 0) + (data.overheadCosts?.others || 0))],
    ['Net Profit', formatCurrency((data.metrics.grossProfit || 0) - ((data.overheadCosts?.rent || 0) + (data.overheadCosts?.salaries || 0) + (data.overheadCosts?.electricity || 0) + (data.overheadCosts?.others || 0)))],
    ['Expiry Risk Loss', formatCurrency(data.metrics.expiryRiskLoss || 0)],
    ['Dead Stock Value', formatCurrency(data.metrics.deadStockValue || 0)],
  ];

  autoTable(doc, {
    head: [metricsData[0]],
    body: metricsData.slice(1),
    startY: yPosition,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor as any,
      textColor: [255, 255, 255] as any,
      fontStyle: 'bold',
    },
    bodyStyles: {
      textColor: textColor as any,
    },
    alternateRowStyles: {
      fillColor: lightGray as any,
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Alerts Section
  if (data.alerts && Object.keys(data.alerts).length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Alerts', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    const alertsData = [
      ['Alert Type', 'Count', 'Value'],
      ['Expiry Risk', data.alerts.expiryRiskCount || 0, formatCurrency(data.alerts.expiryRiskValue || 0)],
      ['Dead Stock', data.alerts.deadStockCount || 0, formatCurrency(data.alerts.deadStockValue || 0)],
      ['Low Margin', data.alerts.lowMarginCount || 0, formatCurrency(data.alerts.lowMarginValue || 0)],
    ];

    autoTable(doc, {
      head: [alertsData[0]],
      body: alertsData.slice(1),
      startY: yPosition,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor as any,
        textColor: [255, 255, 255] as any,
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: textColor as any,
      },
      alternateRowStyles: {
        fillColor: lightGray as any,
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Key Insights Section
  if (data.insights && data.insights.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Key Insights & Recommendations', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    data.insights.slice(0, 5).forEach((insight: any, index: number) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont(undefined as any, 'bold');
      doc.text(`${index + 1}. ${insight.title || 'Insight'}`, 20, yPosition);
      yPosition += 6;

      doc.setFont(undefined as any, 'normal');
      const wrappedText = doc.splitTextToSize(insight.description || '', pageWidth - 40) as string[];
      doc.text(wrappedText, 20, yPosition);
      yPosition += wrappedText.length * 5 + 4;
    });
  }

  // Footer
  const pageCount = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' } as any
    );
  }

  // Download PDF
  const fileName = `PPI_Report_${monthNames[data.month - 1]}_${data.year}.pdf`;
  doc.save(fileName);
};
