import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircle, Edit2, Trash2, Plus, Users, MapPin } from 'lucide-react';
import { trpc } from '../lib/trpc';

export default function BranchManagement() {
  const userQuery = trpc.auth.me.useQuery();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Get user's organizations
  const orgsQuery = trpc.branches.organization.list.useQuery();

  // Get branches for selected organization
  const branchesQuery = trpc.branches.branch.list.useQuery(
    { organizationId: selectedOrgId! },
    { enabled: !!selectedOrgId }
  );

  // Mutations
  const createBranchMutation = trpc.branches.branch.create.useMutation();
  const deleteBranchMutation = trpc.branches.branch.delete.useMutation();

  const handleSelectOrg = (orgId: number) => {
    setSelectedOrgId(orgId);
    setError(null);
  };

  const handleAddBranch = async () => {
    if (!selectedOrgId || !newBranchName.trim()) {
      setError('Branch name is required');
      return;
    }

    try {
      await createBranchMutation.mutateAsync({
        organizationId: selectedOrgId,
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
    if (!confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteBranchMutation.mutateAsync({ branchId });
      branchesQuery.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete branch';
      setError(message);
    }
  };

  if (orgsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading organizations...</p>
        </div>
      </div>
    );
  }

  const orgs = orgsQuery.data?.data || [];

  if (orgs.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Organizations</h2>
          <p className="text-gray-600">You don't have any organizations yet.</p>
        </div>
      </div>
    );
  }

  const selectedOrg = orgs.find(o => o.id === selectedOrgId);
  const branches = branchesQuery.data?.data || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Branch Management</h1>
        <p className="text-gray-600">Manage your pharmacy branches and team members</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Organizations List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Your Organizations</h2>
            <div className="space-y-2">
              {orgs.map(org => (
                <button
                  key={org.id}
                  onClick={() => handleSelectOrg(org.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedOrgId === org.id
                      ? 'bg-blue-100 border border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium text-gray-900">{org.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {branches.length} branches
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Branches Management */}
        <div className="lg:col-span-3">
          {selectedOrg ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedOrg.name}</h2>
                  <p className="text-sm text-gray-600">Manage branches for this organization</p>
                </div>
                <Dialog open={isAddingBranch} onOpenChange={setIsAddingBranch}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Branch
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Branch</DialogTitle>
                      <DialogDescription>
                        Create a new pharmacy branch for {selectedOrg.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
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
                      <div className="flex gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsAddingBranch(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddBranch}
                          disabled={createBranchMutation.isPending || !newBranchName.trim()}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          {createBranchMutation.isPending ? 'Creating...' : 'Create Branch'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {branchesQuery.isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading branches...</p>
                  </div>
                </div>
              ) : branches.length === 0 ? (
                <Card className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">No Branches</h3>
                  <p className="text-gray-600 mb-4">Create your first branch to get started</p>
                  <Button
                    onClick={() => setIsAddingBranch(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Branch
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {branches.map(branch => (
                    <Card key={branch.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{branch.name}</h3>
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
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 pt-3 border-t">
                        <Users className="w-4 h-4" />
                        <span>Manage team members</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Select an Organization</h3>
              <p className="text-gray-600">Choose an organization from the list to manage its branches</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
