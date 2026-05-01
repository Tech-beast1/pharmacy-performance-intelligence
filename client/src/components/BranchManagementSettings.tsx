import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { AlertCircle, Plus, Trash2, MapPin } from 'lucide-react';
import { trpc } from '../lib/trpc';

interface BranchManagementSettingsProps {
  organizationId: number;
}

export function BranchManagementSettings({ organizationId }: BranchManagementSettingsProps) {
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Queries
  const branchesQuery = trpc.branches.branch.list.useQuery({ organizationId });

  // Mutations
  const createBranchMutation = trpc.branches.branch.create.useMutation();
  const deleteBranchMutation = trpc.branches.branch.delete.useMutation();

  const handleAddBranch = async () => {
    if (!newBranchName.trim()) {
      setError('Branch name is required');
      return;
    }

    try {
      setError(null);
      await createBranchMutation.mutateAsync({
        organizationId,
        name: newBranchName.trim(),
        location: newBranchLocation.trim() || undefined,
      });

      setNewBranchName('');
      setNewBranchLocation('');
      setIsAddingBranch(false);
      branchesQuery.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create branch';
      setError(message);
    }
  };

  const handleDeleteBranch = async (branchId: number) => {
    if (!confirm('Are you sure you want to delete this branch?')) {
      return;
    }

    try {
      setError(null);
      await deleteBranchMutation.mutateAsync({ branchId });
      branchesQuery.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete branch';
      setError(message);
    }
  };

  const branches = branchesQuery.data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Branches</h3>
        <Button
          size="sm"
          onClick={() => setIsAddingBranch(!isAddingBranch)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isAddingBranch && (
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch Name *
              </label>
              <Input
                placeholder="e.g., Accra Main"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                placeholder="e.g., Accra, Ghana"
                value={newBranchLocation}
                onChange={(e) => setNewBranchLocation(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingBranch(false);
                  setNewBranchName('');
                  setNewBranchLocation('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddBranch}
                disabled={createBranchMutation.isPending || !newBranchName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createBranchMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {branchesQuery.isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : branches.length === 0 ? (
        <Card className="p-4 text-center text-gray-600">
          No branches yet. Create your first branch to get started.
        </Card>
      ) : (
        <div className="space-y-2">
          {branches.map(branch => (
            <Card key={branch.id} className="p-4 flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{branch.name}</h4>
                {branch.location && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    {branch.location}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDeleteBranch(branch.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete branch"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
