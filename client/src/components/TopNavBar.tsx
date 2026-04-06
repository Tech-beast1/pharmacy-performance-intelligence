import { trpc } from '@/lib/trpc';
import { Building2, Calendar, User } from 'lucide-react';

export function TopNavBar() {
  const { data: profileData } = trpc.pharmacy.getProfile.useQuery();
  const profile = profileData?.profile;

  if (!profile) {
    return null;
  }

  const startDate = profile.reportStartDate ? new Date(profile.reportStartDate) : null;
  const endDate = profile.reportEndDate ? new Date(profile.reportEndDate) : null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const dateRangeText = startDate && endDate 
    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-8">
        {/* Pharmacy Info - Green Circle */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-md border-4 border-green-300">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{profile.pharmacyName}</p>
            {profile.location && (
              <p className="text-gray-600 text-xs">{profile.location}</p>
            )}
          </div>
        </div>

        {/* Date Range - Red Circle */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white shadow-md border-4 border-red-300">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{dateRangeText}</p>
            <p className="text-gray-600 text-xs">Reporting Period</p>
          </div>
        </div>

        {/* Owner Info - Blue Circle */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-md border-4 border-blue-300">
            <User className="w-8 h-8" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{profile.ownerName}</p>
            <p className="text-gray-600 text-xs">Pharmacy Owner</p>
          </div>
        </div>
      </div>
    </div>
  );
}
