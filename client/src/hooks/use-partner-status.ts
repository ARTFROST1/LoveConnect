import { useEffect, useState, useCallback } from 'react';
import { telegramService } from '@/lib/telegram';
import { useToast } from '@/hooks/use-toast';

export interface PartnerStatusHook {
  partnerStatus: any | null;
  hasPartner: boolean;
  partnerData: any | null;
  isLoading: boolean;
  refreshStatus: () => Promise<void>;
}

export function usePartnerStatus(): PartnerStatusHook {
  const [partnerStatus, setPartnerStatus] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const hasPartner = Boolean(partnerStatus);
  const partnerData = partnerStatus;

  const refreshStatus = useCallback(async () => {
    try {
      const user = telegramService.user;
      if (!user) {
        setPartnerStatus(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      const response = await fetch(`/api/partner/status/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setPartnerStatus(data.partnership);
        
        // Убираем уведомления о подключении партнера для улучшения UX
        // if (data.partnership && !partnerStatus) {
        //   toast({
        //     title: "Партнёр подключился!",
        //     description: `${data.partnership.partnerName} принял ваше приглашение`,
        //     duration: 5000
        //   });
        //   telegramService.hapticFeedback('notification', 'success');
        // }
      } else {
        setPartnerStatus(null);
      }
    } catch (error) {
      console.error('Error refreshing partner status:', error);
      setPartnerStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [partnerStatus, toast]);

  useEffect(() => {
    refreshStatus();

    // Poll for partner status updates every 5 seconds
    const interval = setInterval(() => {
      refreshStatus();
    }, 5000);

    // Listen for visibility changes to refresh when app becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshStatus]);

  return { partnerStatus, hasPartner, partnerData, isLoading, refreshStatus };
}