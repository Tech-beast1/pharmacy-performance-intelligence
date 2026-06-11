import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check } from "lucide-react";

export function SubscriptionPlans() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: plans, isLoading } = trpc.subscription.getPlans.useQuery();
  const { data: subscriptionStatus } = trpc.subscription.getStatus.useQuery();
  const createCheckoutMutation = trpc.subscription.createCheckoutSession.useMutation();

  const handleSubscribe = async (tier: string) => {
    try {
      setLoading(true);
      setSelectedTier(tier);

      const result = await createCheckoutMutation.mutateAsync({ tier });

      if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      }
    } catch (error) {
      console.error("Failed to create checkout session");
    } finally {
      setLoading(false);
      setSelectedTier(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const planFeatures = {
    silver: ["1 Pharmacy", "Unlimited Uploads", "Full Analytics", "Email Support"],
    gold: ["2-3 Branches", "Unlimited Uploads", "Full Analytics", "Priority Support"],
    diamond: ["4-5 Branches", "Unlimited Uploads", "Full Analytics", "Priority Support"],
    platinum: [
      "Unlimited Branches",
      "Unlimited Uploads",
      "Full Analytics",
      "24/7 Support",
      "Dedicated Manager",
    ],
  };

  const tierColors = {
    silver: {
      name: "text-slate-700",
      price: "text-slate-800",
      border: "border-slate-300",
      button: "bg-slate-600 hover:bg-slate-700",
      checkmark: "text-slate-500",
      badge: "bg-slate-600",
    },
    gold: {
      name: "text-amber-700",
      price: "text-amber-800",
      border: "border-amber-300",
      button: "bg-amber-600 hover:bg-amber-700",
      checkmark: "text-amber-500",
      badge: "bg-amber-600",
    },
    diamond: {
      name: "text-cyan-700",
      price: "text-cyan-800",
      border: "border-cyan-300",
      button: "bg-cyan-600 hover:bg-cyan-700",
      checkmark: "text-cyan-500",
      badge: "bg-cyan-600",
    },
    platinum: {
      name: "text-purple-700",
      price: "text-purple-800",
      border: "border-purple-400",
      button: "bg-purple-600 hover:bg-purple-700",
      checkmark: "text-purple-500",
      badge: "bg-purple-600",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {subscriptionStatus?.hasReachedLimit ? "Upgrade Your Plan" : "Choose Your Plan"}
          </h1>
          {!subscriptionStatus?.hasReachedLimit && (
            <p className="text-xl text-slate-600">
              Start with 4 free uploads, then upgrade to unlock unlimited access
            </p>
          )}
          {subscriptionStatus?.hasReachedLimit && (
            <p className="text-xl text-slate-600">
              You've used all 4 free uploads. Subscribe now to continue uploading and unlock unlimited features.
            </p>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans?.map((plan) => {
            const colors = tierColors[plan.tier as keyof typeof tierColors];
            return (
              <Card
                key={plan.tier}
                className={`relative flex flex-col transition-all duration-300 border-2 ${colors.border} ${
                  plan.tier === "platinum"
                    ? "lg:scale-105 shadow-lg"
                    : "hover:shadow-lg"
                }`}
              >
                {plan.tier === "platinum" && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className={`${colors.badge} text-white px-4 py-1 rounded-full text-sm font-semibold`}>
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className={`text-2xl font-bold ${colors.name}`}>
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Price */}
                  <div className="mb-6">
                    <div className={`text-4xl font-bold ${colors.price}`}>
                      ₵{plan.price.toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">per month</p>
                  </div>

                  {/* Features */}
                  <div className="mb-6 flex-1">
                    <ul className="space-y-3">
                      {planFeatures[plan.tier as keyof typeof planFeatures]?.map(
                        (feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${colors.checkmark}`} />
                            <span className="text-sm text-slate-700">{feature}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSubscribe(plan.tier)}
                    disabled={loading && selectedTier === plan.tier}
                    className={`w-full font-semibold text-white ${colors.button}`}
                  >
                    {loading && selectedTier === plan.tier ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ or Info Section */}
        <div className="mt-16 bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Can I change my plan later?
              </h3>
              <p className="text-slate-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Which plan is right for me?
              </h3>
              <p className="text-slate-600">
                Choose based on your needs: Silver for single pharmacies, Gold for small chains (2-3 branches),
                Diamond for growing chains (4-5 branches), and Platinum for enterprises with unlimited branches.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Is there a contract?
              </h3>
              <p className="text-slate-600">
                No, all plans are month-to-month. You can cancel anytime with no
                penalties.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Can I add more branches later?
              </h3>
              <p className="text-slate-600">
                Yes, you can upgrade your plan anytime to add more branches. Simply
                upgrade your subscription and the new branch limit takes effect immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
