import { useEffect } from 'react';
import { useSearchParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function PaystackCheckout() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  // NOTE: tier is NOT read from URL - it's determined server-side from payment amount

  const utils = trpc.useUtils();
  const verifyMutation = trpc.subscription.verifyAndActivateSubscription.useMutation({
    onSuccess: async () => {
      // Invalidate subscription status cache to refresh UI immediately
      await utils.subscription.getStatus.invalidate();
    },
  });

  useEffect(() => {
    if (reference) {
      // Auto-verify payment after redirect from Paystack
      // Tier will be determined server-side from payment amount
      verifyMutation.mutate({ reference });
    }
  }, [reference]);

  if (verifyMutation.isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold">Verifying your payment...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we confirm your subscription.</p>
        </Card>
      </div>
    );
  }

  if (verifyMutation.isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your subscription has been activated successfully! You now have unlimited uploads and access to all features.
          </p>
          <Button onClick={() => window.location.href = '/'} className="w-full">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (verifyMutation.isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            {verifyMutation.error?.message || 'There was an error processing your payment. Please try again.'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => window.location.href = '/subscription'}>
              Back to Plans
            </Button>
            <Button className="flex-1" onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
