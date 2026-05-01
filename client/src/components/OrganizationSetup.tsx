import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { trpc } from '../lib/trpc';

interface OrganizationSetupProps {
  onComplete: (organizationId: number) => void;
  onCancel: () => void;
}

export function OrganizationSetup({ onComplete, onCancel }: OrganizationSetupProps) {
  const [organizationName, setOrganizationName] = useState('');
  const [firstBranchName, setFirstBranchName] = useState('');
  const [firstBranchLocation, setFirstBranchLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createOrgMutation = trpc.branches.organization.create.useMutation();
  const createBranchMutation = trpc.branches.branch.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate inputs
      if (!organizationName.trim()) {
        throw new Error('Organization name is required');
      }
      if (!firstBranchName.trim()) {
        throw new Error('First branch name is required');
      }

      // Create organization
      const orgResult = await createOrgMutation.mutateAsync({
        name: organizationName.trim(),
      });

      if (!orgResult.success || !orgResult.data?.id) {
        throw new Error('Failed to create organization');
      }

      const organizationId = orgResult.data.id;

      // Create first branch
      const branchResult = await createBranchMutation.mutateAsync({
        organizationId,
        name: firstBranchName.trim(),
        location: firstBranchLocation.trim() || undefined,
      });

      if (!branchResult.success) {
        throw new Error('Failed to create first branch');
      }

      // Success
      onComplete(organizationId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Set Up Your Organization</h1>
          <p className="text-gray-600 mb-6">Create your organization and add your first pharmacy branch</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <Input
                type="text"
                placeholder="e.g., Tech Beast Pharmacy Group"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">The name of your pharmacy group or company</p>
            </div>

            {/* First Branch Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Branch Name *
              </label>
              <Input
                type="text"
                placeholder="e.g., Accra Main"
                value={firstBranchName}
                onChange={(e) => setFirstBranchName(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Name of your first pharmacy location</p>
            </div>

            {/* First Branch Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch Location
              </label>
              <Input
                type="text"
                placeholder="e.g., Accra, Ghana"
                value={firstBranchLocation}
                onChange={(e) => setFirstBranchLocation(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Optional: City or address of your branch</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

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
                disabled={isLoading || !organizationName.trim() || !firstBranchName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Organization'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
