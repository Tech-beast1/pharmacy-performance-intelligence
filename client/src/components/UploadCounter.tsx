import { trpc } from "@/lib/trpc";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export function UploadCounter() {
  const [, navigate] = useLocation();
  const { data: status } = trpc.subscription.getStatus.useQuery();

  if (!status) return null;

  const uploadCount = status.uploadCount || 0;
  const freeUploadsRemaining = status.freeUploadsRemaining || 0;
  const isSubscribed = status.subscription.status === "active";
  const progressPercentage = (uploadCount / 4) * 100;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isSubscribed ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-slate-900">
                Subscription Active: {status.subscription.tier.toUpperCase()}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <span className="font-semibold text-slate-900">
                Free Uploads Remaining: {freeUploadsRemaining}/4
              </span>
            </>
          )}
        </div>
      </div>

      {!isSubscribed && (
        <>
          <Progress value={progressPercentage} className="h-2 mb-3" />
          <p className="text-sm text-slate-600 mb-3">
            {uploadCount === 0
              ? "You have 4 free uploads before you need to subscribe."
              : freeUploadsRemaining > 0
              ? `You have ${freeUploadsRemaining} free upload${freeUploadsRemaining === 1 ? "" : "s"} remaining.`
              : "You've used all your free uploads. Please subscribe to continue."}
          </p>

          {uploadCount >= 4 && (
            <button
              onClick={() => navigate("/subscription")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              View Subscription Plans
            </button>
          )}
        </>
      )}

      {isSubscribed && (
        <p className="text-sm text-green-600">
          You have unlimited uploads with your {status.subscription.tier} subscription.
        </p>
      )}
    </div>
  );
}
