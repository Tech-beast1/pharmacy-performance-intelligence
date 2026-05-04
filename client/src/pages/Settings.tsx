import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { Settings as SettingsIcon, Bell, Lock, HelpCircle, Eye } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { BranchManagementSettings } from '@/components/BranchManagementSettings';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';

function ViewModeToggle() {
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
    setIsLoading(true);
    try {
      const profile = profileQuery.data?.profile;
      if (profile) {
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
          onClick={() => handleModeChange('single')}
          disabled={isLoading}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            viewMode === 'single'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="font-semibold text-gray-900">Single Pharmacy</div>
          <div className="text-sm text-gray-600">View only your main pharmacy</div>
        </button>
        <button
          onClick={() => handleModeChange('multi')}
          disabled={isLoading}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
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

export default function Settings() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="space-y-6">
    <PageHeader title="Settings" description="Configure your pharmacy settings" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Account Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          Account Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Login Method</label>
            <input
              type="text"
              value={user?.loginMethod || 'Manus OAuth'}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Expiry Alerts</p>
              <p className="text-sm text-gray-600">Get notified when products are expiring soon</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Dead Stock Alerts</p>
              <p className="text-sm text-gray-600">Get notified about slow-moving inventory</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Weekly Reports</p>
              <p className="text-sm text-gray-600">Receive weekly performance summaries</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Security
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Your account is secured with Manus OAuth authentication. Your data is encrypted and secure.
          </p>
          <Button variant="outline" onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </div>
      </Card>

      {/* View Mode Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          View Mode
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">Choose how you want to view your pharmacy data</p>
          <ViewModeToggle />
        </div>
      </Card>

      {/* Branch Management */}
      <BranchManagementSettings />

      {/* Help & Support */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Help & Support
        </h3>
        <div className="space-y-3">
          <div>
            <p className="font-medium text-gray-900">Documentation</p>
            <p className="text-sm text-gray-600">Learn how to use Pharmacy Performance Intelligence</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Version</p>
            <p className="text-sm text-gray-600">Pharmacy Performance Intelligence v1.0.0</p>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">About PPI</h3>
        <p className="text-gray-700">
          Pharmacy Performance Intelligence is a comprehensive analytics platform designed to help pharmacy owners and managers track sales, manage inventory, and maximize profitability. With real-time data insights and intelligent alerts, PPI empowers you to make data-driven decisions for your business.
        </p>
      </Card>
    </div>
  );
}
