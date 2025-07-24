import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

// Import pages
import Home from "@/pages/Home";
import AddPartner from "@/pages/AddPartnerNew";
import GameList from "@/pages/GameList";
import GameRoom from "@/pages/GameRoom";
import History from "@/pages/History";
import Profile from "@/pages/Profile";
import Navigation from "@/components/Navigation";
import TestPage from "@/pages/TestPage";
import TestInvite from "@/pages/TestInvite";
import InviteTest from "@/pages/InviteTest";
import PartnerTest from "@/pages/PartnerTest";
import StartappTest from "@/pages/StartappTest";
import ReferralTest from "@/pages/ReferralTest";
import TestReferralLink from "@/pages/TestReferralLink";
import NotFound from "@/pages/not-found";

// Import services
import { telegramService } from "@/lib/telegram";
import { database } from "@/lib/database";
import { useReferralProcessing } from "@/hooks/use-referral-processing";

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/add-partner" component={AddPartner} />
        <Route path="/games" component={GameList} />
        <Route path="/game/:gameId" component={GameRoom} />
        <Route path="/history" component={History} />
        <Route path="/profile" component={Profile} />
        <Route path="/profile/:partnerId" component={Profile} />
        <Route path="/test" component={TestPage} />
        <Route path="/test-invite" component={TestInvite} />
        <Route path="/invite-test" component={InviteTest} />
        <Route path="/partner-test" component={PartnerTest} />
        <Route path="/startapp-test" component={StartappTest} />
        <Route path="/referral-test" component={ReferralTest} />
        <Route path="/test-referral-link" component={TestReferralLink} />
        <Route component={NotFound} />
      </Switch>
      <Navigation />
    </>
  );
}

function App() {
  // Process referral links automatically when app starts
  const { isProcessing: isProcessingReferral } = useReferralProcessing();

  useEffect(() => {
    // Initialize Telegram WebApp
    if (telegramService.isAvailable) {
      // Apply theme
      if (telegramService.colorScheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Initialize database
    database.initialize().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Toaster />
          {isProcessingReferral ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Обрабатываем реферальную ссылку...</p>
              </div>
            </div>
          ) : (
            <Router />
          )}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
