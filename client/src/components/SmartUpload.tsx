import { useState, useRef } from 'react';
import { Upload, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface ColumnMapping {
  productName: string;
  price: string;
  quantity: string;
  expiryDate: string;
  costPrice?: string;
  sku?: string;
  saleQuantity?: string;
  saleDate?: string;
}

interface UploadStep {
  step: 'upload' | 'mapping' | 'preview' | 'processing' | 'complete';
}

export default function SmartUpload() {
  const [uploadStep, setUploadStep] = useState<UploadStep['step']>('upload');
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [columns, setColumns] = useState<string[]>([]);
  const [sampleRow, setSampleRow] = useState<any>({});
  const [mapping, setMapping] = useState<ColumnMapping>({
    productName: '',
    price: '',
    quantity: '',
    expiryDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectColumnsMutation = trpc.upload.detectColumns.useMutation();
  const processFileMutation = trpc.upload.processFile.useMutation();

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          setCsvContent(content);

          // Detect columns from CSV content
          const result = await detectColumnsMutation.mutateAsync({ csvContent: content });
          if (result.success) {
            setColumns(result.columns || []);
            setSampleRow(result.sampleRow || {});
            setUploadStep('mapping');
          } else {
            toast.error(result.error || 'Failed to detect columns');
          }
        } catch (error) {
          console.error('Detection error:', error);
          toast.error('Failed to detect columns');
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('File read error:', error);
      toast.error('Failed to read file');
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setMapping(prev => ({ ...prev, [field]: value }));
  };

  const handleProcessFile = async () => {
    // Validate mapping
    if (!mapping.productName || !mapping.price || !mapping.quantity || !mapping.expiryDate) {
      toast.error('Please map all required fields');
      return;
    }

    setIsLoading(true);
    setUploadStep('processing');

    try {
      const result = await processFileMutation.mutateAsync({
        csvContent,
        mapping,
        fileName,
      });

      if (result.success) {
        setUploadStep('complete');
        toast.success(`${result.processedCount} items processed successfully`);
        if ((result.errorCount || 0) > 0) {
          toast.warning(`${result.errorCount} rows had errors and were skipped`);
        }
        // Reset after 2 seconds
        setTimeout(() => {
          resetUpload();
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to process file');
        setUploadStep('mapping');
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process file');
      setUploadStep('mapping');
    } finally {
      setIsLoading(false);
    }
  };

  const resetUpload = () => {
    setUploadStep('upload');
    setCsvContent('');
    setFileName('');
    setColumns([]);
    setSampleRow({});
    setMapping({
      productName: '',
      price: '',
      quantity: '',
      expiryDate: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Upload Step */}
      {uploadStep === 'upload' && (
        <Card className="p-8 border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors">
          <div
            className="flex flex-col items-center justify-center py-12 cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-16 h-16 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Upload Zone</h3>
            <p className="text-gray-600 mb-4">Drag and drop your CSV or Excel file here, or click to browse</p>
            <p className="text-sm text-gray-500">Supported formats: CSV, XLSX</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>
        </Card>
      )}

      {/* Mapping Step */}
      {uploadStep === 'mapping' && (
        <div className="space-y-6">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Map Your Columns</h3>
            <p className="text-sm text-gray-600 mb-6">
              Select which columns in your file correspond to these fields. We detected {columns.length} columns.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <Select value={mapping.productName} onValueChange={(value) => handleMappingChange('productName', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <Select value={mapping.price} onValueChange={(value) => handleMappingChange('price', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <Select value={mapping.quantity} onValueChange={(value) => handleMappingChange('quantity', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <Select value={mapping.expiryDate} onValueChange={(value) => handleMappingChange('expiryDate', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cost Price (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Price <span className="text-gray-500">(Optional)</span>
                </label>
                <Select value={mapping.costPrice || ''} onValueChange={(value) => handleMappingChange('costPrice', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SKU (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU <span className="text-gray-500">(Optional)</span>
                </label>
                <Select value={mapping.sku || ''} onValueChange={(value) => handleMappingChange('sku', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sample Row Preview */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Sample Row Preview:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {mapping.productName && (
                  <div><span className="font-medium">Product:</span> {sampleRow[mapping.productName]}</div>
                )}
                {mapping.price && (
                  <div><span className="font-medium">Price:</span> {sampleRow[mapping.price]}</div>
                )}
                {mapping.quantity && (
                  <div><span className="font-medium">Qty:</span> {sampleRow[mapping.quantity]}</div>
                )}
                {mapping.expiryDate && (
                  <div><span className="font-medium">Expiry:</span> {sampleRow[mapping.expiryDate]}</div>
                )}
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={resetUpload}>
              Back
            </Button>
            <Button
              onClick={handleProcessFile}
              disabled={isLoading || !mapping.productName || !mapping.price || !mapping.quantity || !mapping.expiryDate}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Process File
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Processing Step */}
      {uploadStep === 'processing' && (
        <Card className="p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Your File</h3>
          <p className="text-gray-600">This may take a few moments...</p>
        </Card>
      )}

      {/* Complete Step */}
      {uploadStep === 'complete' && (
        <Card className="p-8 text-center bg-green-50 border-green-200">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Successful!</h3>
          <p className="text-gray-600 mb-6">Your data has been processed and added to the dashboard.</p>
          <Button onClick={resetUpload} className="w-full">
            Upload Another File
          </Button>
        </Card>
      )}
    </div>
  );
}
