import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { generatePDF } from '@/utils/pdfGenerator';

interface DownloadReportPDFProps {
  branchId?: number;
  month: string; // YYYY-MM format
}

export default function DownloadReportPDF({ branchId, month }: DownloadReportPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Parse month and year from the month string
  const [year, monthNum] = month.split('-').map(Number);

  // Call the backend to get PDF data
  const generatePDFMutation = trpc.reports.generatePDF.useMutation();

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // Call backend to get all necessary data for PDF
      const result = await generatePDFMutation.mutateAsync({
        branchId,
        month: monthNum,
        year,
      });

      if (!result.success) {
        toast.error('Failed to generate PDF report');
        setIsGenerating(false);
        return;
      }

      // Generate and download PDF
      if (result.data) {
        generatePDF(result.data);
        toast.success('PDF report downloaded successfully!');
      } else {
        toast.error('No data available for PDF generation');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
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
