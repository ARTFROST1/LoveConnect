import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

// Import pages
import Home from "@/pages/Home";
import WelcomePage from "@/pages/WelcomePage";
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
import { usePartnerSync } from "@/hooks/use-partner-sync";

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [location] = useLocation();

  // Get user data
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const tgUser = telegramService.user;
        if (tgUser) {
          setUser(tgUser);
        }
      } catch (error) {
        console.error('Failed to get user:', error);
      } finally {
        setUserLoaded(true);
      }
    };
    
    initializeUser();
  }, []);

  // Check partner status using only one hook to avoid conflicts
  const { partner: syncedPartner, isLoading: partnerLoading } = usePartnerSync(user?.id || 0);

  // Determine if user has a partner
  const hasPartner = Boolean(
    syncedPartner && syncedPartner.id && syncedPartner.partner_name && syncedPartner.partner_telegram_id
  );

  // Show welcome screen only on home route when no partner exists and data is loaded
  const shouldShowWelcome = userLoaded && location === '/' && !hasPartner && !partnerLoading;

  // Show navigation only when user has a partner or on non-home routes
  const shouldShowNavigation = hasPartner || (location !== '/' && !shouldShowWelcome);

  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Switch>
        {/* Special case: show welcome page when on home route without partner */}
        {shouldShowWelcome && <Route path="/" component={WelcomePage} />}
        
        {/* Normal routes */}
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
      
      {/* Show navigation only when appropriate */}
      {shouldShowNavigation && <Navigation />}
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
          <AppContent />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
