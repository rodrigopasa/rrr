import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard-page";
import AuthPage from "@/pages/auth-page";
import ContactsPage from "@/pages/contacts-page";
import MessagesPage from "@/pages/messages-page";
import SchedulePage from "@/pages/schedule-page";
import WhatsAppSetupPage from "@/pages/whatsapp-setup-page";
import WhatsAppGroupsContactsPage from "@/pages/whatsapp-groups-contacts-page";
import ReportsPage from "@/pages/reports-page";
import CampaignManagerPage from "@/pages/campaign-manager-page";
import MessageTemplatesPage from "@/pages/message-templates-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/contacts" component={ContactsPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/schedule" component={SchedulePage} />
      <ProtectedRoute path="/whatsapp-setup" component={WhatsAppSetupPage} />
      <ProtectedRoute path="/whatsapp-groups-contacts" component={WhatsAppGroupsContactsPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/campaign-manager" component={CampaignManagerPage} />
      <ProtectedRoute path="/message-templates" component={MessageTemplatesPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
