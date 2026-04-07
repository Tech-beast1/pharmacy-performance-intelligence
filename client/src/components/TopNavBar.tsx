import { trpc } from '@/lib/trpc';
import { Building2, Calendar, User } from 'lucide-react';
import { useState } from 'react';
import { OnboardingModal } from './OnboardingModal';

export function TopNavBar() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
    <>
      <div className="border-b border-gray-200 px-6 py-4 shadow-sm" style={{ backgroundColor: '#a46060' }}>
        <div className="flex items-center justify-between gap-8">
          {/* Pharmacy Info - Green Circle - Clickable */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-4 flex-1 hover:opacity-80 transition-opacity text-left"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-md border-4 border-green-300 flex-shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{profile.pharmacyName}</p>
              {profile.location && (
                <p className="text-white/80 text-xs">{profile.location}</p>
              )}
            </div>
          </button>

          {/* Date Range - Red Circle - Clickable */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-4 flex-1 hover:opacity-80 transition-opacity text-left"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white shadow-md border-4 border-red-300 flex-shrink-0">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{dateRangeText}</p>
              <p className="text-white/80 text-xs">Reporting Period</p>
            </div>
          </button>

          {/* Owner Info - Blue Circle - Clickable */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-4 flex-1 hover:opacity-80 transition-opacity text-left"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-md border-4 border-blue-300 flex-shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{profile.ownerName}</p>
              <p className="text-white/80 text-xs">Pharmacy Owner</p>
            </div>
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <OnboardingModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}
