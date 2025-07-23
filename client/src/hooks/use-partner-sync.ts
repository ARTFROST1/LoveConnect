import { useEffect, useState, useCallback } from 'react';
import { database } from '@/lib/database';
import { telegramService } from '@/lib/telegram';
import { useToast } from '@/hooks/use-toast';

export interface PartnerSyncResult {
  partner: any | null;
  isLoading: boolean;
  refreshPartner: () => Promise<void>;
}

export function usePartnerSync(userId: number): PartnerSyncResult {
  const [partner, setPartner] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshPartner = useCallback(async () => {
    try {
      setIsLoading(true);
      const dbPartner = await database.getPartner(userId);
      setPartner(dbPartner);
    } catch (error) {
      console.error('Error refreshing partner:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Check for partner updates when component mounts or becomes visible
  useEffect(() => {
    refreshPartner();

    // Set up interval to check for partner updates every 5 seconds
    // This helps detect when the inviter accepts the connection
    const interval = setInterval(() => {
      refreshPartner();
    }, 5000);

    // Listen for visibility changes to refresh when app becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshPartner();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshPartner]);

  // Listen for window focus events as alternative to Telegram events
  useEffect(() => {
    const handleFocus = () => {
      // Refresh when window gets focus
      setTimeout(refreshPartner, 500);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshPartner]);

  return {
    partner,
    isLoading,
    refreshPartner
  };
}