import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [pharmacyName, setPharmacyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [location, setLocation] = useState('');
  const [setupDate, setSetupDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: profileData } = trpc.pharmacy.getProfile.useQuery(undefined, {
    enabled: isOpen,
  });

  const saveProfile = trpc.pharmacy.saveProfile.useMutation();

  useEffect(() => {
    if (profileData?.profile) {
      setPharmacyName(profileData.profile.pharmacyName);
      setOwnerName(profileData.profile.ownerName);
      setLocation(profileData.profile.location || '');
      const date = new Date(profileData.profile.setupDate);
      setSetupDate(date.toISOString().split('T')[0]);
      if (profileData.profile.reportStartDate) {
        const startDate = new Date(profileData.profile.reportStartDate);
        setReportStartDate(startDate.toISOString().split('T')[0]);
      }
      if (profileData.profile.reportEndDate) {
        const endDate = new Date(profileData.profile.reportEndDate);
        setReportEndDate(endDate.toISOString().split('T')[0]);
      }
    }
  }, [profileData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!pharmacyName.trim()) {
      setError('Please enter pharmacy name');
      return;
    }

    if (!ownerName.trim()) {
      setError('Please enter owner name');
      return;
    }

    setIsLoading(true);
    try {
      await saveProfile.mutateAsync({
        pharmacyName: pharmacyName.trim(),
        ownerName: ownerName.trim(),
        location: location.trim(),
        setupDate,
        reportStartDate,
        reportEndDate,
      });

      onClose();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save pharmacy profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pharmacy Profile Setup</DialogTitle>
          <DialogDescription>
            Enter your pharmacy information to get started
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pharmacyName">Pharmacy Name</Label>
            <Input
              id="pharmacyName"
              placeholder="e.g., Health Plus Pharmacy"
              value={pharmacyName}
              onChange={(e) => setPharmacyName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input
              id="ownerName"
              placeholder="e.g., John Doe"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Pharmacy Location</Label>
            <Input
              id="location"
              placeholder="e.g., Accra, Ghana"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setupDate">Setup Date</Label>
            <Input
              id="setupDate"
              type="date"
              value={setupDate}
              onChange={(e) => setSetupDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportStartDate">Report Start Date</Label>
            <Input
              id="reportStartDate"
              type="date"
              value={reportStartDate}
              onChange={(e) => setReportStartDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportEndDate">Report End Date</Label>
            <Input
              id="reportEndDate"
              type="date"
              value={reportEndDate}
              onChange={(e) => setReportEndDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
