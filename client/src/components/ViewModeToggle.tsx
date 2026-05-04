import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export function ViewModeToggle() {
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('multi');
  const [isLoading, setIsLoading] = useState(false);
  const updateProfileMutation = trpc.pharmacy.saveProfile.useMutation();
  const profileQuery = trpc.pharmacy.getProfile.useQuery();

  useEffect(() => {
    if (profileQuery.data?.profile?.viewMode) {
      setViewMode(profileQuery.data.profile.viewMode as 'single' | 'multi');
    }
  }, [profileQuery.data?.profile?.viewMode]);

  const handleModeChange = async (mode: 'single' | 'multi') => {
    console.log('handleModeChange called with mode:', mode);
    setIsLoading(true);
    try {
      const profile = profileQuery.data?.profile;
      console.log('Profile:', profile);
      if (profile) {
        console.log('Updating profile with viewMode:', mode);
        await updateProfileMutation.mutateAsync({
          pharmacyName: profile.pharmacyName,
          ownerName: profile.ownerName,
          setupDate: profile.setupDate,
          location: profile.location || '',
          reportStartDate: profile.reportStartDate || undefined,
          reportEndDate: profile.reportEndDate || undefined,
          viewMode: mode,
        });
        setViewMode(mode);
        console.log('View mode updated to:', mode);
        await profileQuery.refetch();
      } else {
        console.log('Profile not found, creating default profile');
        await updateProfileMutation.mutateAsync({
          pharmacyName: 'My Pharmacy',
          ownerName: 'Owner',
          setupDate: new Date(),
          location: '',
          viewMode: mode,
        });
        setViewMode(mode);
        console.log('Default profile created with viewMode:', mode);
        await profileQuery.refetch();
      }
    } catch (error) {
      console.error('Failed to update view mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => handleModeChange('single')}
          disabled={isLoading}
          className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer ${
            viewMode === 'single'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="font-semibold text-gray-900">Single Pharmacy</div>
          <div className="text-sm text-gray-600">View only your main pharmacy</div>
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('multi')}
          disabled={isLoading}
          className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer ${
            viewMode === 'multi'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="font-semibold text-gray-900">Multi-Branch</div>
          <div className="text-sm text-gray-600">View all branches and compare</div>
        </button>
      </div>
    </div>
  );
}
