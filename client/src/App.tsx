import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Admin from "@/pages/Admin";
import GovernmentDatasetDetail from "@/pages/GovernmentDatasetDetail";
import GovernmentDatasets from "@/pages/GovernmentDatasets";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import Methodology from "@/pages/Methodology";
import NotFound from "@/pages/NotFound";
import ReportDetail from "@/pages/ReportDetail";
import Reports from "@/pages/Reports";
import SourceDetail from "@/pages/SourceDetail";
import Sources from "@/pages/Sources";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sources" component={Sources} />
      <Route path="/sources/:slug">{params => <SourceDetail slug={params.slug} />}</Route>
      <Route path="/government-data" component={GovernmentDatasets} />
      <Route path="/government-data/:datasetId">{params => <GovernmentDatasetDetail datasetId={params.datasetId} />}</Route>
      <Route path="/reports" component={Reports} />
      <Route path="/reports/:slug">{params => <ReportDetail slug={params.slug} />}</Route>
      <Route path="/methodology" component={Methodology} />
      <Route path="/library" component={Library} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
