import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { trpc } from '../lib/trpc';

interface SinglePharmacySetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function SinglePharmacySetup({ onComplete, onCancel }: SinglePharmacySetupProps) {
  const [pharmacyName, setPharmacyName] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setUserTypeMutation = trpc.branches.userType.set.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!pharmacyName.trim()) {
        throw new Error('Pharmacy name is required');
      }

      // Set user type to single_pharmacy
      const result = await setUserTypeMutation.mutateAsync({
        type: 'single_pharmacy',
      });

      if (!result.success) {
        throw new Error('Failed to set up pharmacy');
      }

      // Success
      onComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Set Up Your Pharmacy</h1>
          <p className="text-gray-600 mb-6">Tell us about your pharmacy to get started</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pharmacy Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pharmacy Name *
              </label>
              <Input
                type="text"
                placeholder="e.g., Tech Beast Pharmacy"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">The name of your pharmacy</p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                type="text"
                placeholder="e.g., Accra, Ghana"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Optional: City or address of your pharmacy</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                You can upgrade to manage multiple branches anytime from your account settings.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !pharmacyName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Get Started'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
