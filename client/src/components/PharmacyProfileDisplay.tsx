import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Building2, User, Calendar, Edit2 } from 'lucide-react';

interface PharmacyProfileDisplayProps {
  onEditClick?: () => void;
}

export function PharmacyProfileDisplay({ onEditClick }: PharmacyProfileDisplayProps) {
  const { data: profileData, isLoading } = trpc.pharmacy.getProfile.useQuery();

  if (isLoading) {
    return (
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
      </div>
    );
  }

  const profile = profileData?.profile;

  if (!profile) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">No pharmacy profile set</span>
        <Button
          size="sm"
          variant="outline"
          onClick={onEditClick}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Setup Profile
        </Button>
      </div>
    );
  }

  const setupDate = new Date(profile.setupDate);
  const formattedDate = setupDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Get initials for circular badges
  const pharmacyInitials = profile.pharmacyName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const ownerInitials = profile.ownerName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-6">
      {/* Pharmacy Name Circle */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
          {pharmacyInitials}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">{profile.pharmacyName}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 justify-center mt-1">
            <Building2 className="w-3 h-3" />
            Pharmacy
          </p>
        </div>
      </div>

      {/* Owner Name Circle */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
          {ownerInitials}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">{profile.ownerName}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 justify-center mt-1">
            <User className="w-3 h-3" />
            Owner
          </p>
        </div>
      </div>

      {/* Setup Date Circle */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md text-center px-2">
          {setupDate.getDate()}<br />{setupDate.toLocaleString('en-US', { month: 'short' })}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">{formattedDate}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 justify-center mt-1">
            <Calendar className="w-3 h-3" />
            Setup Date
          </p>
        </div>
      </div>

      {/* Edit Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={onEditClick}
        className="ml-4"
      >
        <Edit2 className="w-4 h-4 mr-2" />
        Edit
      </Button>
    </div>
  );
}
