import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

// Import pages
import Home from "@/pages/Home";
import AddPartner from "@/pages/AddPartner";
import GameList from "@/pages/GameList";
import GameRoom from "@/pages/GameRoom";
import History from "@/pages/History";
import Navigation from "@/components/Navigation";
import NotFound from "@/pages/not-found";

// Import services
import { telegramService } from "@/lib/telegram";
import { database } from "@/lib/database";
import { useInviteProcessing } from "@/hooks/use-invite-processing";

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/add-partner" component={AddPartner} />
        <Route path="/games" component={GameList} />
        <Route path="/games/*" component={GameList} /> {/* Handle /games with query params */}
        <Route path="/game/:gameId" component={GameRoom} />
        <Route path="/history" component={History} />
        <Route path="/profile" component={Home} /> {/* Profile redirects to home for now */}
        <Route component={NotFound} />
      </Switch>
      <Navigation />
    </>
  );
}

function App() {
  // Process invite links automatically when app starts
  const { isProcessing: isProcessingInvite } = useInviteProcessing();

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
          {isProcessingInvite ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Обрабатываем приглашение...</p>
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
