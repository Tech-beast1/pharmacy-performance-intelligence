import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Building2, User, Calendar, Edit2 } from 'lucide-react';

interface PharmacyProfileHeaderProps {
  onEditClick?: () => void;
}

export function PharmacyProfileHeader({ onEditClick }: PharmacyProfileHeaderProps) {
  const { data: profileData, isLoading } = trpc.pharmacy.getProfile.useQuery();

  const profile = profileData?.profile;

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8 px-6 rounded-lg mb-6">
        <div className="flex gap-8 items-center justify-center">
          <div className="w-20 h-20 bg-white/20 rounded-full animate-pulse" />
          <div className="w-20 h-20 bg-white/20 rounded-full animate-pulse" />
          <div className="w-20 h-20 bg-white/20 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-dashed border-gray-300 py-8 px-6 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Welcome to Pharmacy Performance Intelligence</h2>
            <p className="text-gray-600 mt-2">Set up your pharmacy profile to get started</p>
          </div>
          <Button
            onClick={onEditClick}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Setup Profile
          </Button>
        </div>
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
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8 px-6 rounded-lg mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Pharmacy Performance Intelligence</h1>
          <p className="text-blue-100 mt-2">Your pharmacy dashboard and analytics platform</p>
        </div>
        <Button
          onClick={onEditClick}
          variant="secondary"
          className="bg-white text-blue-600 hover:bg-blue-50"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Circular Badges */}
      <div className="flex items-center gap-12 justify-center">
        {/* Pharmacy Name Circle */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white/30">
            {pharmacyInitials}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{profile.pharmacyName}</p>
            <p className="text-xs text-blue-100 flex items-center gap-1 justify-center mt-1">
              <Building2 className="w-3 h-3" />
              Pharmacy
            </p>
          </div>
        </div>

        {/* Owner Name Circle */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white/30">
            {ownerInitials}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{profile.ownerName}</p>
            <p className="text-xs text-blue-100 flex items-center gap-1 justify-center mt-1">
              <User className="w-3 h-3" />
              Owner
            </p>
          </div>
        </div>

        {/* Setup Date Circle */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white/30 text-center px-2">
            <div>
              <div className="text-lg">{setupDate.getDate()}</div>
              <div className="text-xs">{setupDate.toLocaleString('en-US', { month: 'short' })}</div>
              <div className="text-xs">{setupDate.getFullYear()}</div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{formattedDate}</p>
            <p className="text-xs text-blue-100 flex items-center gap-1 justify-center mt-1">
              <Calendar className="w-3 h-3" />
              Setup Date
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
