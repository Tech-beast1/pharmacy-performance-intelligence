import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import DashboardMultiBranch from "./pages/DashboardMultiBranch";
import DataUpload from "./pages/DataUpload";
import InventoryIntelligence from "./pages/InventoryIntelligence";

import OverheadCosts from "./pages/OverheadCosts";
import Settings from "./pages/Settings";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { SignupFlow } from "./components/SignupFlow";
import { trpc } from "./lib/trpc";

function Router() {
  const userTypeQuery = trpc.branches.userType.get.useQuery(undefined, {
    retry: false,
  });

  // Show signup flow if user hasn't selected a type yet
  if (userTypeQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userTypeQuery.data?.data) {
    return <SignupFlow />;
  }

  const userType = userTypeQuery.data.data.type;
  const DashboardComponent = userType === 'organization_owner' ? DashboardMultiBranch : Dashboard;

  return (
    <Switch>
      <Route path="/" nest>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={DashboardComponent} />
            <Route path="/upload" component={DataUpload} />
            <Route path="/inventory" component={InventoryIntelligence} />

            <Route path="/overhead" component={OverheadCosts} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AnimatedBackground />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
