import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '../lib/trpc';

interface BranchSelectorProps {
  selectedBranchId: number | null;
  onBranchChange: (branchId: number | null) => void;
}

export function BranchSelector({ selectedBranchId, onBranchChange }: BranchSelectorProps) {
  const userTypeQuery = trpc.branches.userType.get.useQuery();
  const orgsQuery = trpc.branches.organization.list.useQuery();
  const branchesQuery = trpc.branches.branch.list.useQuery(
    { organizationId: orgsQuery.data?.data?.[0]?.id! },
    { enabled: !!orgsQuery.data?.data?.[0]?.id }
  );

  const userType = userTypeQuery.data?.data?.type;
  const orgs = orgsQuery.data?.data || [];
  const branches = branchesQuery.data?.data || [];

  // For single pharmacy owners, don't show selector
  if (userType === 'single_pharmacy') {
    return null;
  }

  // For organization owners, show branch selector
  if (userType === 'organization_owner' && branches.length > 0) {
    return (
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">View:</label>
        <Select
          value={selectedBranchId === null ? 'all' : selectedBranchId.toString()}
          onValueChange={(value) => {
            onBranchChange(value === 'all' ? null : parseInt(value));
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map(branch => (
              <SelectItem key={branch.id} value={branch.id.toString()}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return null;
}
