import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Zap } from "lucide-react";
import { useLocation } from "wouter";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [, navigate] = useLocation();
  const { data: plans } = trpc.subscription.getPlans.useQuery();

  if (!isOpen) return null;

  const handleViewPlans = () => {
    onClose();
    navigate("/subscription");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Upgrade Your Plan
            </CardTitle>
            <CardDescription>
              You've used all 4 of your free uploads
            </CardDescription>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-slate-700 mb-4">
              You've completed your 4 free uploads. Subscribe to one of our plans to continue uploading and managing your pharmacy data.
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-slate-900">Silver:</span>
                <span className="text-slate-600">₵350/month - Single Pharmacy</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-slate-900">Gold:</span>
                <span className="text-slate-600">₵850/month - 2-3 Branches</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-slate-900">Diamond:</span>
                <span className="text-slate-600">₵1,500/month - 4-5 Branches</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-slate-900">Platinum:</span>
                <span className="text-slate-600">₵3,000/month - Unlimited Branches</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Continue Later
            </Button>
            <Button
              onClick={handleViewPlans}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
