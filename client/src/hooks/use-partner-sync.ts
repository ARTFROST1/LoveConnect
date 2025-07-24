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
      
      // Сначала проверяем локальную базу данных
      const dbPartner = await database.getPartner(userId);
      console.log('Partner data from local DB:', dbPartner);
      
      // Если в локальной базе нет партнера, проверяем сервер
      if (!dbPartner) {
        try {
          const response = await fetch(`/api/partner/status/${userId}`);
          if (response.ok) {
            const serverData = await response.json();
            console.log('Partner data from server:', serverData);
            
            if (serverData.partnership) {
              // Синхронизируем данные с сервера в локальную базу
              const partnerInfo = {
                userId: userId,
                partnerTelegramId: serverData.partnership.partnerId,
                partnerName: serverData.partnership.partnerName,
                partnerAvatar: null,
                connectedAt: serverData.partnership.connectedAt,
                status: serverData.partnership.status || 'connected'
              };
              
              console.log('Syncing partner data to local DB:', partnerInfo);
              
              await database.addPartner(
                partnerInfo.userId,
                partnerInfo.partnerTelegramId,
                partnerInfo.partnerName,
                partnerInfo.partnerAvatar,
                partnerInfo.connectedAt,
                partnerInfo.status
              );
              
              // Получаем обновленные данные из локальной базы
              const updatedPartner = await database.getPartner(userId);
              setPartner(updatedPartner);
            } else {
              setPartner(null);
            }
          } else {
            setPartner(dbPartner);
          }
        } catch (serverError) {
          console.error('Error fetching from server:', serverError);
          setPartner(dbPartner);
        }
      } else {
        setPartner(dbPartner);
      }
    } catch (error) {
      console.error('Error refreshing partner:', error);
      setPartner(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Check for partner updates when component mounts or becomes visible
  useEffect(() => {
    refreshPartner();

    // Set up interval to check for partner updates every 15 seconds
    // This helps detect when the inviter accepts the connection
    const interval = setInterval(() => {
      refreshPartner();
    }, 15000);

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