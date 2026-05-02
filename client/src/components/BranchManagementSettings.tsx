import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface Branch {
  id: number;
  name: string;
  location: string | null;
  managerName: string | null;
  managerPhone: string | null;
}

export function BranchManagementSettings() {
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [newBranchManagerName, setNewBranchManagerName] = useState('');
  const [newBranchManagerPhone, setNewBranchManagerPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchLocation, setEditBranchLocation] = useState('');
  const [editBranchManagerName, setEditBranchManagerName] = useState('');
  const [editBranchManagerPhone, setEditBranchManagerPhone] = useState('');

  // Get user's organization
  const organizationsQuery = trpc.branches.organization.list.useQuery();
  const organization = organizationsQuery.data?.data?.[0];

  // Get branches for the organization
  const branchesQuery = trpc.branches.branch.list.useQuery(
    { organizationId: organization?.id || 0 },
    { enabled: !!organization?.id }
  );
  const branches = branchesQuery.data?.data || [];

  // Mutations
  const createBranchMutation = trpc.branches.branch.create.useMutation();
  const deleteBranchMutation = trpc.branches.branch.delete.useMutation();
  const updateBranchMutation = trpc.branches.branch.update.useMutation();

  const handleEditBranch = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setEditBranchName(branch.name);
    setEditBranchLocation(branch.location || '');
    setEditBranchManagerName(branch.managerName || '');
    setEditBranchManagerPhone(branch.managerPhone || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!editBranchName.trim()) {
      setError('Branch name is required');
      return;
    }

    try {
      await updateBranchMutation.mutateAsync({
        branchId: editingBranchId!,
        name: editBranchName.trim(),
        location: editBranchLocation.trim() || undefined,
        managerName: editBranchManagerName.trim() || undefined,
        managerPhone: editBranchManagerPhone.trim() || undefined,
      });

      setSuccess('Branch updated successfully!');
      setEditingBranchId(null);
      branchesQuery.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update branch';
      setError(message);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newBranchName.trim()) {
      setError('Branch name is required');
      return;
    }

    if (!organization?.id) {
      setError('Organization not found');
      return;
    }

    try {
      await createBranchMutation.mutateAsync({
        organizationId: organization.id,
        name: newBranchName.trim(),
        location: newBranchLocation.trim() || undefined,
        managerName: newBranchManagerName.trim() || undefined,
        managerPhone: newBranchManagerPhone.trim() || undefined,
      });

      setSuccess('Branch added successfully!');
      setNewBranchName('');
      setNewBranchLocation('');
      setNewBranchManagerName('');
      setNewBranchManagerPhone('');
      setIsAddingBranch(false);
      
      // Refetch branches
      branchesQuery.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add branch';
      setError(message);
    }
  };

  const handleDeleteBranch = async (branchId: number) => {
    if (!confirm('Are you sure you want to delete this branch?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await deleteBranchMutation.mutateAsync({ branchId });
      setSuccess('Branch deleted successfully!');
      branchesQuery.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete branch';
      setError(message);
    }
  };

  if (!organization) {
    return null; // Only show for organization owners
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Branch Management</h3>
        {!isAddingBranch && (
          <Button
            onClick={() => setIsAddingBranch(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Add Branch Form */}
      {isAddingBranch && (
        <form onSubmit={handleAddBranch} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch Name *
              </label>
              <Input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="e.g., Downtown Branch"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                type="text"
                value={newBranchLocation}
                onChange={(e) => setNewBranchLocation(e.target.value)}
                placeholder="e.g., 123 Main St, Accra"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager Name
              </label>
              <Input
                type="text"
                value={newBranchManagerName}
                onChange={(e) => setNewBranchManagerName(e.target.value)}
                placeholder="e.g., John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager Phone
              </label>
              <Input
                type="tel"
                value={newBranchManagerPhone}
                onChange={(e) => setNewBranchManagerPhone(e.target.value)}
                placeholder="e.g., +233 24 123 4567"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createBranchMutation.isPending}
              >
                {createBranchMutation.isPending ? 'Adding...' : 'Add Branch'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddingBranch(false);
                  setNewBranchName('');
                  setNewBranchLocation('');
                  setNewBranchManagerName('');
                  setNewBranchManagerPhone('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Edit Branch Form */}
      {editingBranchId !== null && (
        <form onSubmit={handleSaveEdit} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-gray-900 mb-4">Edit Branch</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch Name *
              </label>
              <Input
                type="text"
                value={editBranchName}
                onChange={(e) => setEditBranchName(e.target.value)}
                placeholder="e.g., Downtown Branch"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                type="text"
                value={editBranchLocation}
                onChange={(e) => setEditBranchLocation(e.target.value)}
                placeholder="e.g., 123 Main St, Accra"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager Name
              </label>
              <Input
                type="text"
                value={editBranchManagerName}
                onChange={(e) => setEditBranchManagerName(e.target.value)}
                placeholder="e.g., John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager Phone
              </label>
              <Input
                type="tel"
                value={editBranchManagerPhone}
                onChange={(e) => setEditBranchManagerPhone(e.target.value)}
                placeholder="e.g., +233 24 123 4567"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={updateBranchMutation.isPending}
              >
                {updateBranchMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingBranchId(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Branches List */}
      <div className="space-y-3">
        {branches.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No branches yet. Add your first branch to get started.</p>
        ) : (
          branches.map((branch: Branch) => (
            <div
              key={branch.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{branch.name}</h4>
                {branch.location && (
                  <p className="text-sm text-gray-600">{branch.location}</p>
                )}
                {branch.managerName && (
                  <p className="text-sm text-gray-600">Manager: {branch.managerName}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditBranch(branch)}
                  className="flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteBranch(branch.id)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  disabled={deleteBranchMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
