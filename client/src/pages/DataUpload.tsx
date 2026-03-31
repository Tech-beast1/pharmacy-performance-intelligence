import SmartUpload from '@/components/SmartUpload';

export default function DataUpload() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Upload</h1>
        <p className="text-gray-600 mt-1">Import your pharmacy sales and inventory data</p>
      </div>

      <SmartUpload />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Supported File Formats</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ CSV (Comma-Separated Values)</li>
            <li>✓ XLSX (Excel 2007+)</li>
            <li>✓ XLS (Excel 97-2003)</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Required Columns</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Product Name</li>
            <li>✓ Price</li>
            <li>✓ Quantity</li>
            <li>✓ Expiry Date</li>
          </ul>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Tips for Best Results</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Use consistent date formats (YYYY-MM-DD recommended)</li>
          <li>• Ensure numeric values don't have currency symbols</li>
          <li>• Include Cost Price for accurate margin calculations</li>
          <li>• Add Sale Date and Sale Quantity for trend analysis</li>
          <li>• Each upload appends to your existing data (cumulative)</li>
        </ul>
      </div>
    </div>
  );
}
