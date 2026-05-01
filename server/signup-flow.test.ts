import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from './db';
import {
  getUserType,
  setUserType,
  createOrganization,
  getOrganization,
  createBranch,
  getBranch,
  addUserToBranch,
  getUserRoleInBranch,
} from './db-branches';

const TEST_USER_ID = 99999;
const TEST_USER_ID_2 = 99998;

describe('Signup Flow - User Type Management', () => {
  afterAll(async () => {
    // Cleanup
    try {
      await db.delete(require('./db').branchUsers).where(
        require('drizzle-orm').eq(require('./db').branchUsers.userId, TEST_USER_ID)
      );
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('User Type Selection', () => {
    it('should set user type to organization_owner', async () => {
      const result = await setUserType(TEST_USER_ID, 'organization_owner');
      expect(result).toBeDefined();
      expect(result?.type).toBe('organization_owner');
    });

    it('should get user type after setting', async () => {
      await setUserType(TEST_USER_ID, 'organization_owner');
      const result = await getUserType(TEST_USER_ID);
      expect(result?.type).toBe('organization_owner');
    });

    it('should update user type from organization_owner to single_pharmacy', async () => {
      await setUserType(TEST_USER_ID, 'organization_owner');
      const result = await setUserType(TEST_USER_ID, 'single_pharmacy');
      expect(result?.type).toBe('single_pharmacy');

      // Verify the update
      const check = await getUserType(TEST_USER_ID);
      expect(check?.type).toBe('single_pharmacy');
    });

    it('should set user type to single_pharmacy', async () => {
      const result = await setUserType(TEST_USER_ID_2, 'single_pharmacy');
      expect(result).toBeDefined();
      expect(result?.type).toBe('single_pharmacy');
    });
  });

  describe('Organization Owner Setup Flow', () => {
    it('should create organization for owner', async () => {
      const orgName = 'Tech Beast Pharmacy Group';
      const org = await createOrganization(TEST_USER_ID, orgName);

      expect(org).toBeDefined();
      expect(org?.name).toBe(orgName);
      expect(org?.ownerId).toBe(TEST_USER_ID);
    });

    it('should create first branch for organization', async () => {
      // Create org first
      const org = await createOrganization(TEST_USER_ID, 'Tech Beast Pharmacy Group');
      if (!org?.id) throw new Error('Failed to create organization');

      // Create first branch
      const branch = await createBranch(
        org.id,
        'Accra Main',
        'Accra, Ghana'
      );

      expect(branch).toBeDefined();
      expect(branch?.name).toBe('Accra Main');
      expect(branch?.location).toBe('Accra, Ghana');
      expect(branch?.organizationId).toBe(org.id);
    });

    it('should add owner to branch as owner', async () => {
      // Create org and branch
      const org = await createOrganization(TEST_USER_ID, 'Tech Beast Pharmacy Group');
      if (!org?.id) throw new Error('Failed to create organization');

      const branch = await createBranch(org.id, 'Accra Main', 'Accra, Ghana');
      if (!branch?.id) throw new Error('Failed to create branch');

      // Add user as owner
      const result = await addUserToBranch(TEST_USER_ID, branch.id, 'owner');

      expect(result).toBeDefined();
      expect(result?.role).toBe('owner');
      expect(result?.userId).toBe(TEST_USER_ID);
      expect(result?.branchId).toBe(branch.id);
    });

    it('should verify owner role in branch', async () => {
      // Create org and branch
      const org = await createOrganization(TEST_USER_ID, 'Tech Beast Pharmacy Group');
      if (!org?.id) throw new Error('Failed to create organization');

      const branch = await createBranch(org.id, 'Accra Main', 'Accra, Ghana');
      if (!branch?.id) throw new Error('Failed to create branch');

      // Add user as owner
      await addUserToBranch(TEST_USER_ID, branch.id, 'owner');

      // Verify role
      const role = await getUserRoleInBranch(TEST_USER_ID, branch.id);
      expect(role).toBe('owner');
    });

    it('should complete full organization owner signup flow', async () => {
      // Step 1: Set user type
      const userType = await setUserType(TEST_USER_ID, 'organization_owner');
      expect(userType?.type).toBe('organization_owner');

      // Step 2: Create organization
      const org = await createOrganization(TEST_USER_ID, 'Tech Beast Pharmacy Group');
      expect(org).toBeDefined();
      if (!org?.id) throw new Error('Failed to create organization');

      // Step 3: Create first branch
      const branch = await createBranch(org.id, 'Accra Main', 'Accra, Ghana');
      expect(branch).toBeDefined();
      if (!branch?.id) throw new Error('Failed to create branch');

      // Step 4: Add owner to branch
      const branchUser = await addUserToBranch(TEST_USER_ID, branch.id, 'owner');
      expect(branchUser?.role).toBe('owner');

      // Step 5: Verify setup
      const verifyOrg = await getOrganization(org.id);
      expect(verifyOrg?.ownerId).toBe(TEST_USER_ID);

      const verifyBranch = await getBranch(branch.id);
      expect(verifyBranch?.organizationId).toBe(org.id);

      const verifyRole = await getUserRoleInBranch(TEST_USER_ID, branch.id);
      expect(verifyRole).toBe('owner');
    });
  });

  describe('Single Pharmacy Owner Setup Flow', () => {
    it('should complete full single pharmacy signup flow', async () => {
      // Step 1: Set user type to single_pharmacy
      const userType = await setUserType(TEST_USER_ID_2, 'single_pharmacy');
      expect(userType?.type).toBe('single_pharmacy');

      // Step 2: Verify user type
      const verify = await getUserType(TEST_USER_ID_2);
      expect(verify?.type).toBe('single_pharmacy');
    });
  });

  describe('User Type Conversion', () => {
    it('should convert single_pharmacy to organization_owner', async () => {
      // Start as single pharmacy
      await setUserType(TEST_USER_ID, 'single_pharmacy');
      let userType = await getUserType(TEST_USER_ID);
      expect(userType?.type).toBe('single_pharmacy');

      // Convert to organization owner
      userType = await setUserType(TEST_USER_ID, 'organization_owner');
      expect(userType?.type).toBe('organization_owner');

      // Verify conversion
      userType = await getUserType(TEST_USER_ID);
      expect(userType?.type).toBe('organization_owner');
    });

    it('should convert organization_owner to single_pharmacy', async () => {
      // Start as organization owner
      await setUserType(TEST_USER_ID, 'organization_owner');
      let userType = await getUserType(TEST_USER_ID);
      expect(userType?.type).toBe('organization_owner');

      // Convert to single pharmacy
      userType = await setUserType(TEST_USER_ID, 'single_pharmacy');
      expect(userType?.type).toBe('single_pharmacy');

      // Verify conversion
      userType = await getUserType(TEST_USER_ID);
      expect(userType?.type).toBe('single_pharmacy');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing organization gracefully', async () => {
      const org = await getOrganization(999999);
      expect(org).toBeNull();
    });

    it('should handle missing branch gracefully', async () => {
      const branch = await getBranch(999999);
      expect(branch).toBeNull();
    });

    it('should handle invalid user type gracefully', async () => {
      const userType = await getUserType(999999);
      expect(userType).toBeNull();
    });
  });
});
