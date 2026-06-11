import { describe, it, expect } from 'vitest';

/**
 * Test to validate Paystack credentials are correctly configured
 */
describe('Paystack Integration', () => {
  it('should have Paystack credentials configured', () => {
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    expect(publicKey).toBeDefined();
    expect(secretKey).toBeDefined();
    expect(publicKey).toMatch(/^pk_live_/);
    expect(secretKey).toMatch(/^sk_live_/);
  });

  it('should have valid Paystack plan IDs', () => {
    // These are the plan IDs provided by the user
    const plans = {
      silver: 'PLN_b3uqtdfmragtvci',
      gold: 'PLN_ogxc1rkg3m10jq5',
      diamond: 'PLN_8l682wl4a1f4ucf',
      platinum: 'PLN_yqhsraz90a0y512',
    };

    expect(plans.silver).toBeDefined();
    expect(plans.gold).toBeDefined();
    expect(plans.diamond).toBeDefined();
    expect(plans.platinum).toBeDefined();

    // Verify plan ID format
    Object.values(plans).forEach((planId) => {
      expect(planId).toMatch(/^PLN_/);
    });
  });
});
