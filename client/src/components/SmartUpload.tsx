import { useState, useRef, useEffect } from 'react';
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

interface SheetInfo {
  name: string;
  columns: string[];
  dataType: 'sales' | 'inventory' | 'unknown';
}

interface UploadStep {
  step: 'upload' | 'sheetSelect' | 'dataType' | 'mapping' | 'preview' | 'processing' | 'complete';
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
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectColumnsMutation = trpc.upload.detectColumns.useMutation();
  const processFileMutation = trpc.upload.processFile.useMutation();
  const utils = trpc.useUtils();

  // Helper function to get a safe value for Select (never empty string)
  const getSafeSelectValue = (value: string | undefined, defaultCol: string) => {
    return value && value.trim() ? value : defaultCol;
  };

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
            // Check if it's a multi-sheet file
            if (result.multiSheet && result.sheets && result.sheets.length > 1) {
              setSheets(result.sheets);
              setSelectedSheet(result.sheets[0].name);
              setUploadStep('sheetSelect');
            } else {
              // Single sheet or CSV file
              setColumns(result.columns || []);
              setSampleRow(result.sampleRow || {});
              
              // Auto-detect data type if possible
              if (result.sheets && result.sheets.length === 1) {
                const detectedType = result.sheets[0].dataType;
                if (detectedType !== 'unknown') {
                  setDataType(detectedType);
                }
              }
              
              setUploadStep('dataType');
            }
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

  const handleSheetSelect = async (sheetName: string) => {
    setSelectedSheet(sheetName);
    setIsLoading(true);

    try {
      // Re-detect columns for the selected sheet
      const result = await detectColumnsMutation.mutateAsync({ csvContent: csvContent });
      
      if (result.success && result.sheets) {
        const selectedSheetInfo = result.sheets.find(s => s.name === sheetName);
        if (selectedSheetInfo) {
          setColumns(selectedSheetInfo.columns);
          setDataType(selectedSheetInfo.dataType !== 'unknown' ? selectedSheetInfo.dataType : 'sales');
          setUploadStep('dataType');
        }
      }
    } catch (error) {
      console.error('Sheet selection error:', error);
      toast.error('Failed to load sheet');
    } finally {
      setIsLoading(false);
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
        sheetName: selectedSheet || undefined,
        mapping: mapping as any,
        uploadDate: selectedMonth,
      });

      if (result.success) {
        setUploadStep('complete');
        toast.success(`${result.processedCount} items processed successfully`);
        if ((result.errorCount || 0) > 0) {
          toast.warning(`${result.errorCount} rows had errors and were skipped`);
        }
        
        // Invalidate analytics queries to refresh dashboard with new data
        await utils.analytics.getDashboardMetrics.invalidate();
        await utils.analytics.getAlerts.invalidate();
        await utils.analytics.getTopProducts.invalidate();
        await utils.analytics.getRevenueTrend.invalidate();
        
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
    setSheets([]);
    setSelectedSheet('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const defaultCol = columns[0] || '';

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Upload Step */}
      {uploadStep === 'upload' && (
        <Card className="p-4 md:p-8 border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors">
          <div
            className="flex flex-col items-center justify-center py-8 md:py-12 cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 md:w-16 h-12 md:h-16 text-blue-600 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Smart Upload Zone</h3>
            <p className="text-sm md:text-base text-gray-600 mb-4 text-center px-2">Drag and drop your CSV or Excel file here, or click to browse</p>
            <p className="text-xs md:text-sm text-gray-500">Supported formats: CSV, XLSX</p>
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

      {/* Sheet Selection Step (for multi-sheet files) */}
      {uploadStep === 'sheetSelect' && (
        <div className="space-y-6">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Sheet to Import</h3>
            <p className="text-sm text-gray-600 mb-6">
              This file contains multiple sheets. Please select which one to import.
            </p>

            <div className="space-y-3">
              {sheets.map((sheet) => (
                <Card
                  key={sheet.name}
                  className={`p-4 cursor-pointer border-2 transition-all ${
                    selectedSheet === sheet.name
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedSheet(sheet.name)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{sheet.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Type: <span className="font-medium">{sheet.dataType}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Columns: {sheet.columns.slice(0, 3).join(', ')}
                        {sheet.columns.length > 3 ? '...' : ''}
                      </p>
                    </div>
                    {selectedSheet === sheet.name && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <Button
              onClick={() => handleSheetSelect(selectedSheet)}
              disabled={!selectedSheet || isLoading}
              className="mt-6 w-full"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronRight className="w-4 h-4 mr-2" />}
              Continue with {selectedSheet}
            </Button>
          </Card>
        </div>
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
                  Upload inventory with Item Name, Cost, Selling Price, Stock, and Expiry Date
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Item Name/Product</p>
                  <p>• Unit Cost</p>
                  <p>• Selling Price</p>
                  <p>• Stock on Hand</p>
                  <p>• Expiry Date</p>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      )}

      {/* Column Mapping Step */}
      {uploadStep === 'mapping' && (
        <div className="space-y-4 md:space-y-6">
          <Card className="p-4 md:p-6 bg-green-50 border-green-200">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Map Columns</h3>
            <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
              Match your file columns to the system fields
            </p>

            <div className="space-y-3 md:space-y-4">
              {/* Product Name - Required */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <Select value={getSafeSelectValue(mapping.productName, defaultCol)} onValueChange={(value) => handleMappingChange('productName', value)}>
                  <SelectTrigger className="h-10 md:h-9 text-sm">
                    <SelectValue placeholder="Select product name column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sales Data Fields */}
              {dataType === 'sales' && (
                <>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <Select value={getSafeSelectValue(mapping.quantity, defaultCol)} onValueChange={(value) => handleMappingChange('quantity', value)}>
                      <SelectTrigger className="h-10 md:h-9 text-sm">
                        <SelectValue placeholder="Select quantity column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Unit Cost <span className="text-red-500">*</span>
                    </label>
                    <Select value={getSafeSelectValue(mapping.costPrice, defaultCol)} onValueChange={(value) => handleMappingChange('costPrice', value)}>
                      <SelectTrigger className="h-10 md:h-9 text-sm">
                        <SelectValue placeholder="Select unit cost column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Selling Price <span className="text-red-500">*</span>
                    </label>
                    <Select value={getSafeSelectValue(mapping.price, defaultCol)} onValueChange={(value) => handleMappingChange('price', value)}>
                      <SelectTrigger className="h-10 md:h-9 text-sm">
                        <SelectValue placeholder="Select selling price column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Inventory Data Fields */}
              {dataType === 'inventory' && (
                <>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Unit Cost <span className="text-red-500">*</span>
                    </label>
                    <Select value={getSafeSelectValue(mapping.costPrice, defaultCol)} onValueChange={(value) => handleMappingChange('costPrice', value)}>
                      <SelectTrigger className="h-10 md:h-9 text-sm">
                        <SelectValue placeholder="Select unit cost column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Selling Price <span className="text-red-500">*</span>
                    </label>
                    <Select value={getSafeSelectValue(mapping.sellingPrice, defaultCol)} onValueChange={(value) => handleMappingChange('sellingPrice', value)}>
                      <SelectTrigger className="h-10 md:h-9 text-sm">
                        <SelectValue placeholder="Select selling price column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Stock on Hand <span className="text-red-500">*</span>
                    </label>
                    <Select value={getSafeSelectValue(mapping.stockOnHand, defaultCol)} onValueChange={(value) => handleMappingChange('stockOnHand', value)}>
                      <SelectTrigger className="h-10 md:h-9 text-sm">
                        <SelectValue placeholder="Select stock on hand column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Expiry Date <span className="text-red-500">*</span>
                    </label>
                    <Select value={getSafeSelectValue(mapping.expiryDate, defaultCol)} onValueChange={(value) => handleMappingChange('expiryDate', value)}>
                      <SelectTrigger className="h-10 md:h-9 text-sm">
                        <SelectValue placeholder="Select expiry date column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Qty Sold (90 Days) <span className="text-gray-500 text-xs">(optional)</span>
                    </label>
                    <Select value={getSafeSelectValue(mapping.qtySold90Days, defaultCol)} onValueChange={(value) => handleMappingChange('qtySold90Days', value)}>
                      <SelectTrigger className="h-10 md:h-9 text-sm">
                        <SelectValue placeholder="Select qty sold column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={handleProcessFile}
              disabled={isLoading}
              className="mt-6 w-full bg-green-600 hover:bg-green-700 h-12 md:h-10 text-base md:text-sm font-medium"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronRight className="w-4 h-4 mr-2" />}
              Import Data
            </Button>
          </Card>
        </div>
      )}

      {/* Processing Step */}
      {uploadStep === 'processing' && (
        <Card className="p-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing File</h3>
          <p className="text-gray-600">Please wait while we import your data...</p>
        </Card>
      )}

      {/* Complete Step */}
      {uploadStep === 'complete' && (
        <Card className="p-8 text-center bg-green-50 border-green-200">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Successful!</h3>
          <p className="text-gray-600">Your data has been imported successfully. The dashboard will update shortly.</p>
        </Card>
      )}
    </div>
  );
}
