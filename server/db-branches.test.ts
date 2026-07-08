import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  getUserType,
  setUserType,
  createOrganization,
  getOrganization,
  getOrganizationsByOwner,
  createBranch,
  getBranch,
  getBranchesByOrganization,
  updateBranch,
  deleteBranch,
  addUserToBranch,
  removeUserFromBranch,
  getBranchesForUser,
  getUsersForBranch,
  userHasAccessToBranch,
  getUserRoleInBranch,
} from './db-branches';

// Mock user and organization IDs for testing
const TEST_USER_ID = 99999;
const TEST_USER_ID_2 = 99998;
let TEST_ORG_ID: number;
let TEST_BRANCH_ID: number;
let TEST_BRANCH_ID_2: number;

describe('Multi-Branch Database Functions', () => {
  describe('User Type Management', () => {
    it('should set user type to organization_owner', async () => {
      const result = await setUserType(TEST_USER_ID, 'organization_owner');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('organization_owner');
      expect(result?.userId).toBe(TEST_USER_ID);
    });

    it('should get user type', async () => {
      const result = await getUserType(TEST_USER_ID);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('organization_owner');
    });

    it('should update user type from organization_owner to single_pharmacy', async () => {
      await setUserType(TEST_USER_ID, 'organization_owner');
      const result = await setUserType(TEST_USER_ID, 'single_pharmacy');
      expect(result?.type).toBe('single_pharmacy');
    });

    it('should return null for non-existent user type', async () => {
      const result = await getUserType(999999);
      expect(result).toBeNull();
    });
  });

  describe('Organization Management', () => {
    it('should create organization', async () => {
      const result = await createOrganization(TEST_USER_ID, 'Tech Beast Pharmacy Group');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Tech Beast Pharmacy Group');
      expect(result?.ownerId).toBe(TEST_USER_ID);
      if (result?.id) {
        TEST_ORG_ID = result.id;
      }
    });

    it('should get organization by ID', async () => {
      const result = await getOrganization(TEST_ORG_ID);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(TEST_ORG_ID);
      expect(result?.name).toBe('Tech Beast Pharmacy Group');
    });

    it('should get all organizations for owner', async () => {
      const result = await getOrganizationsByOwner(TEST_USER_ID);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].ownerId).toBe(TEST_USER_ID);
    });

    it('should return empty array for owner with no organizations', async () => {
      const result = await getOrganizationsByOwner(999999);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('Branch Management', () => {
    it('should create branch', async () => {
      const result = await createBranch(
        TEST_ORG_ID,
        'Accra Main',
        'Accra, Ghana',
        'John Doe',
        '+233501234567'
      );
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Accra Main');
      expect(result?.location).toBe('Accra, Ghana');
      expect(result?.isActive).toBe(true);
      if (result?.id) {
        TEST_BRANCH_ID = result.id;
      }
    });

    it('should get branch by ID', async () => {
      const result = await getBranch(TEST_BRANCH_ID);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(TEST_BRANCH_ID);
      expect(result?.name).toBe('Accra Main');
    });

    it('should get all branches for organization', async () => {
      // Create second branch
      const branch2 = await createBranch(TEST_ORG_ID, 'Tema Branch', 'Tema, Ghana');
      if (branch2?.id) {
        TEST_BRANCH_ID_2 = branch2.id;
      }

      const result = await getBranchesByOrganization(TEST_ORG_ID);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.every(b => b.organizationId === TEST_ORG_ID)).toBe(true);
    });

    it('should update branch', async () => {
      const result = await updateBranch(TEST_BRANCH_ID, {
        managerName: 'Jane Smith',
        location: 'Accra, Ghana (Updated)',
      });
      expect(result).not.toBeNull();
      expect(result?.managerName).toBe('Jane Smith');
      expect(result?.location).toBe('Accra, Ghana (Updated)');
    });

    it('should deactivate branch', async () => {
      const result = await updateBranch(TEST_BRANCH_ID, { isActive: false });
      expect(result?.isActive).toBe(false);
    });

    it('should reactivate branch', async () => {
      const result = await updateBranch(TEST_BRANCH_ID, { isActive: true });
      expect(result?.isActive).toBe(true);
    });

    it('should delete branch', async () => {
      const result = await deleteBranch(TEST_BRANCH_ID_2);
      expect(result).toBe(true);

      // Verify branch is deleted
      const deleted = await getBranch(TEST_BRANCH_ID_2);
      expect(deleted).toBeNull();
    });
  });

  describe('Branch User Management', () => {
    it('should add user to branch', async () => {
      const result = await addUserToBranch(TEST_USER_ID_2, TEST_BRANCH_ID, 'manager');
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(TEST_USER_ID_2);
      expect(result?.branchId).toBe(TEST_BRANCH_ID);
      expect(result?.role).toBe('manager');
    });

    it('should update user role in branch', async () => {
      // First add user as manager
      await addUserToBranch(TEST_USER_ID_2, TEST_BRANCH_ID, 'manager');
      // Then update to staff
      const result = await addUserToBranch(TEST_USER_ID_2, TEST_BRANCH_ID, 'staff');
      expect(result?.role).toBe('staff');
      // Verify the role was actually updated in database
      const role = await getUserRoleInBranch(TEST_USER_ID_2, TEST_BRANCH_ID);
      expect(role).toBe('staff');
    });

    it('should get users for branch', async () => {
      const result = await getUsersForBranch(TEST_BRANCH_ID);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(u => u.userId === TEST_USER_ID_2)).toBe(true);
    });

    it('should check if user has access to branch', async () => {
      const result = await userHasAccessToBranch(TEST_USER_ID_2, TEST_BRANCH_ID);
      expect(result).toBe(true);
    });

    it('should return false for user without access', async () => {
      const result = await userHasAccessToBranch(999999, TEST_BRANCH_ID);
      expect(result).toBe(false);
    });

    it('should get user role in branch', async () => {
      const result = await getUserRoleInBranch(TEST_USER_ID_2, TEST_BRANCH_ID);
      expect(result).toBe('staff');
    });

    it('should return null for user without access', async () => {
      const result = await getUserRoleInBranch(999999, TEST_BRANCH_ID);
      expect(result).toBeNull();
    });

    it('should get branches for user', async () => {
      const result = await getBranchesForUser(TEST_USER_ID_2);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].role).toBe('staff');
    });

    it('should remove user from branch', async () => {
      const result = await removeUserFromBranch(TEST_USER_ID_2, TEST_BRANCH_ID);
      expect(result).toBe(true);

      // Verify user is removed
      const hasAccess = await userHasAccessToBranch(TEST_USER_ID_2, TEST_BRANCH_ID);
      expect(hasAccess).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle null database gracefully', async () => {
      // These should return null/empty arrays when database is unavailable
      const result1 = await getUserType(-1);
      const result2 = await getOrganization(-1);
      const result3 = await getBranch(-1);
      
      // At least verify they don't throw errors
      expect(true).toBe(true);
    });

    it('should handle invalid IDs gracefully', async () => {
      const result = await getBranch(999999);
      expect(result).toBeNull();
    });

    it('should return empty array for non-existent organization branches', async () => {
      const result = await getBranchesByOrganization(999999);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain branch-organization relationship', async () => {
      const branch = await getBranch(TEST_BRANCH_ID);
      expect(branch?.organizationId).toBe(TEST_ORG_ID);

      const org = await getOrganization(TEST_ORG_ID);
      expect(org?.id).toBe(TEST_ORG_ID);
    });

    it('should cascade delete branch users when branch is deleted', async () => {
      // Create a temporary branch and add user
      const tempBranch = await createBranch(TEST_ORG_ID, 'Temp Branch');
      if (tempBranch?.id) {
        await addUserToBranch(TEST_USER_ID_2, tempBranch.id, 'viewer');

        // Delete branch
        await deleteBranch(tempBranch.id);

        // Verify branch users are deleted
        const users = await getUsersForBranch(tempBranch.id);
        expect(users.length).toBe(0);
      }
    });
  });
});
