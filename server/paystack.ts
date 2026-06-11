import axios from 'axios';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Plan IDs from user's Paystack account
export const PAYSTACK_PLANS = {
  silver: 'PLN_b3uqtdfmragtvci',
  gold: 'PLN_ogxc1rkg3m10jq5',
  diamond: 'PLN_8l682wl4a1f4ucf',
  platinum: 'PLN_yqhsraz90a0y512',
};

// Map subscription tiers to Paystack plan IDs
export const tierToPlanId: Record<string, string> = {
  silver: PAYSTACK_PLANS.silver,
  gold: PAYSTACK_PLANS.gold,
  diamond: PAYSTACK_PLANS.diamond,
  platinum: PAYSTACK_PLANS.platinum,
};

const paystackApi = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Create a Paystack customer
 */
export async function createPaystackCustomer(email: string, firstName: string, lastName: string) {
  try {
    const response = await paystackApi.post('/customer', {
      email,
      first_name: firstName,
      last_name: lastName,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating Paystack customer:', error);
    throw error;
  }
}

/**
 * Initialize a Paystack transaction for one-time payment
 */
export async function initializeTransaction(
  email: string,
  amount: number, // in GHS (will be converted to pesewas)
  reference?: string,
) {
  try {
    const response = await paystackApi.post('/transaction/initialize', {
      email,
      amount: amount * 100, // Convert GHS to pesewas
      reference,
      currency: 'GHS',
    });
    return response.data.data;
  } catch (error) {
    console.error('Error initializing Paystack transaction:', error);
    throw error;
  }
}

/**
 * Verify a Paystack transaction
 */
export async function verifyTransaction(reference: string) {
  try {
    const response = await paystackApi.get(`/transaction/verify/${reference}`);
    return response.data.data;
  } catch (error) {
    console.error('Error verifying Paystack transaction:', error);
    throw error;
  }
}

/**
 * Create a Paystack subscription
 */
export async function createSubscription(
  customerId: number,
  planId: string,
  authorizationCode: string,
) {
  try {
    const response = await paystackApi.post('/subscription', {
      customer: customerId,
      plan: planId,
      authorization: authorizationCode,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating Paystack subscription:', error);
    throw error;
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionCode: string) {
  try {
    const response = await paystackApi.get(`/subscription/${subscriptionCode}`);
    return response.data.data;
  } catch (error) {
    console.error('Error getting Paystack subscription:', error);
    throw error;
  }
}

/**
 * Disable a subscription
 */
export async function disableSubscription(subscriptionCode: string, token: string) {
  try {
    const response = await paystackApi.post(`/subscription/${subscriptionCode}/disable`, {
      token,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error disabling Paystack subscription:', error);
    throw error;
  }
}

/**
 * Enable a subscription
 */
export async function enableSubscription(subscriptionCode: string, token: string) {
  try {
    const response = await paystackApi.post(`/subscription/${subscriptionCode}/enable`, {
      token,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error enabling Paystack subscription:', error);
    throw error;
  }
}

/**
 * Get all plans
 */
export async function getPlans() {
  try {
    const response = await paystackApi.get('/plan');
    return response.data.data;
  } catch (error) {
    console.error('Error getting Paystack plans:', error);
    throw error;
  }
}

/**
 * Get plan details
 */
export async function getPlan(planId: string) {
  try {
    const response = await paystackApi.get(`/plan/${planId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error getting Paystack plan:', error);
    throw error;
  }
}
