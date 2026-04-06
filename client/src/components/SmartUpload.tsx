import { useState, useRef } from 'react';
import { Upload, CheckCircle2, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface ColumnMapping {
  productName: string;
  price?: string;
  quantity?: string;
  expiryDate?: string;
  costPrice?: string;
  sellingPrice?: string;
  stockOnHand?: string;
  qtySold90Days?: string;
  sku?: string;
  saleQuantity?: string;
  saleDate?: string;
  dataType?: 'sales' | 'inventory';
  unitCost?: string;
  sellingCost?: string;
}

interface UploadStep {
  step: 'upload' | 'dataType' | 'mapping' | 'preview' | 'processing' | 'complete';
}

export default function SmartUpload() {
  const [uploadStep, setUploadStep] = useState<UploadStep['step']>('upload');
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [columns, setColumns] = useState<string[]>([]);
  const [sampleRow, setSampleRow] = useState<any>({});
  const [dataType, setDataType] = useState<'sales' | 'inventory'>('sales');
  const [mapping, setMapping] = useState<ColumnMapping>({
    productName: '',
    price: '',
    quantity: '',
    expiryDate: '',
    dataType: 'sales',
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
          // For Excel files, send as base64; for CSV, send as text
          let content: string;
          if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            // For Excel files, use readAsArrayBuffer and convert to base64
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const bytes = new Uint8Array(arrayBuffer);
            content = btoa(String.fromCharCode.apply(null, Array.from(bytes)));
          } else {
            // For CSV files, use text
            content = e.target?.result as string;
          }
          setCsvContent(content);

          // Detect columns from file content
          const result = await detectColumnsMutation.mutateAsync({ csvContent: content });
          if (result.success) {
            setColumns(result.columns || []);
            setSampleRow(result.sampleRow || {});
            setUploadStep('dataType');
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
      // Use appropriate read method based on file type
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
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

  const handleDataTypeSelect = (type: 'sales' | 'inventory') => {
    setDataType(type);
    setMapping({ productName: '', dataType: type });
    setUploadStep('mapping');
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setMapping(prev => ({ ...prev, [field]: value }));
  };

  const handleProcessFile = async () => {
    // Validate mapping based on data type
    if (!mapping.productName) {
      toast.error('Please map Product Name field');
      return;
    }

    if (dataType === 'sales') {
      if (!mapping.price || !mapping.quantity) {
        toast.error('Please map Price and Quantity fields for Sales data');
        return;
      }
    } else if (dataType === 'inventory') {
      if (!mapping.costPrice || !mapping.sellingPrice || !mapping.stockOnHand || !mapping.expiryDate) {
        toast.error('Please map all required fields for Inventory data');
        return;
      }
    }

    setIsLoading(true);
    setUploadStep('processing');

    try {
      const result = await processFileMutation.mutateAsync({
        csvContent,
        mapping: mapping as any,
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
    setDataType('sales');
    setMapping({ productName: '', dataType: 'sales' });
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

      {/* Data Type Selection Step */}
      {uploadStep === 'dataType' && (
        <div className="space-y-6">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Data Type</h3>
            <p className="text-sm text-gray-600 mb-6">
              What type of data are you uploading?
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sales Data Option */}
              <Card
                className={`p-6 cursor-pointer border-2 transition-all ${
                  dataType === 'sales'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleDataTypeSelect('sales')}
              >
                <h4 className="font-semibold text-gray-900 mb-2">Sales Data</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Upload sales transactions with Item Name, Quantity, Unit Cost, and Selling Price
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Item Name/Product</p>
                  <p>• Quantity</p>
                  <p>• Unit Cost</p>
                  <p>• Selling Price</p>
                </div>
              </Card>

              {/* Inventory Data Option */}
              <Card
                className={`p-6 cursor-pointer border-2 transition-all ${
                  dataType === 'inventory'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleDataTypeSelect('inventory')}
              >
                <h4 className="font-semibold text-gray-900 mb-2">Inventory Data</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Upload inventory items with Stock on Hand, Expiry Date, and Sales History
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Item/Product Name</p>
                  <p>• Unit Cost</p>
                  <p>• Selling Cost</p>
                  <p>• Stock on Hand</p>
                  <p>• Expiry Date</p>
                  <p>• Qty Sold (90 days)</p>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      )}

      {/* Mapping Step */}
      {uploadStep === 'mapping' && (
        <div className="space-y-6">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Map Your Columns</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {dataType === 'sales' ? 'Sales Data' : 'Inventory Data'} - {columns.length} columns detected
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadStep('dataType')}
              >
                Change Type
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name - Required for both */}
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

              {/* Sales Data Columns */}
              {dataType === 'sales' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <Select value={mapping.quantity || ''} onValueChange={(value) => handleMappingChange('quantity', value)}>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Cost <span className="text-red-500">*</span>
                    </label>
                    <Select value={mapping.costPrice || ''} onValueChange={(value) => handleMappingChange('costPrice', value)}>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price <span className="text-red-500">*</span>
                    </label>
                    <Select value={mapping.price || ''} onValueChange={(value) => handleMappingChange('price', value)}>
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
                </>
              )}

              {/* Inventory Data Columns */}
              {dataType === 'inventory' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Cost <span className="text-red-500">*</span>
                    </label>
                    <Select value={mapping.costPrice || ''} onValueChange={(value) => handleMappingChange('costPrice', value)}>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Cost <span className="text-red-500">*</span>
                    </label>
                    <Select value={mapping.sellingPrice || ''} onValueChange={(value) => handleMappingChange('sellingPrice', value)}>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock on Hand <span className="text-red-500">*</span>
                    </label>
                    <Select value={mapping.stockOnHand || ''} onValueChange={(value) => handleMappingChange('stockOnHand', value)}>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date <span className="text-red-500">*</span>
                    </label>
                    <Select value={mapping.expiryDate || ''} onValueChange={(value) => handleMappingChange('expiryDate', value)}>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qty Sold (90 days) <span className="text-red-500">*</span>
                    </label>
                    <Select value={mapping.qtySold90Days || ''} onValueChange={(value) => handleMappingChange('qtySold90Days', value)}>
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
                </>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setUploadStep('dataType')}
                variant="outline"
              >
                Back
              </Button>
              <Button
                onClick={handleProcessFile}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
          </Card>
        </div>
      )}

      {/* Processing Step */}
      {uploadStep === 'processing' && (
        <Card className="p-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Your File</h3>
          <p className="text-gray-600">Please wait while we process your data...</p>
        </Card>
      )}

      {/* Complete Step */}
      {uploadStep === 'complete' && (
        <Card className="p-8 text-center bg-green-50 border-green-200">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Successful!</h3>
          <p className="text-gray-600 mb-6">Your data has been processed and added to the system.</p>
          <Button
            onClick={resetUpload}
            className="bg-green-600 hover:bg-green-700"
          >
            Upload Another File
          </Button>
        </Card>
      )}
    </div>
  );
}
