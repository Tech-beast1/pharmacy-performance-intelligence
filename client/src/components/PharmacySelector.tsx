import { Home, MapPin } from 'lucide-react';

interface PharmacySelectorProps {
  pharmacyName: string;
  pharmacyLocation?: string;
  onPharmacyChange: (name: string) => void;
}

export default function PharmacySelector({
  pharmacyName,
  pharmacyLocation = 'Accra, Ghana',
  onPharmacyChange,
}: PharmacySelectorProps) {
  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-2">Pharmacy</label>
      <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-md bg-white">
        {/* Pharmacy Logo */}
        <div className="flex-shrink-0 bg-blue-100 p-2 rounded">
          <Home className="w-5 h-5 text-blue-600" />
        </div>
        
        {/* Pharmacy Info */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={pharmacyName}
            onChange={(e) => onPharmacyChange(e.target.value)}
            placeholder="Enter pharmacy name"
            className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none placeholder-gray-400"
          />
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <MapPin className="w-3 h-3" />
            <span>{pharmacyLocation}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
