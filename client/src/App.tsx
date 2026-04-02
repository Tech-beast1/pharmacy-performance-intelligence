import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import DataUpload from "./pages/DataUpload";
import InventoryIntelligence from "./pages/InventoryIntelligence";
import ReportsInsights from "./pages/ReportsInsights";
import OverheadCosts from "./pages/OverheadCosts";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" nest>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/upload" component={DataUpload} />
            <Route path="/inventory" component={InventoryIntelligence} />
            <Route path="/reports" component={ReportsInsights} />
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
