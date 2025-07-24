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
    if (userId === 0) {
      setPartner(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Получаем Telegram ID пользователя для API запроса
      const tgUser = telegramService.user;
      if (!tgUser) {
        console.log('No Telegram user data available for partner sync');
        setPartner(null);
        setIsLoading(false);
        return;
      }
      
      const telegramUserId = tgUser.id.toString();
      console.log('Checking partnership for Telegram user ID:', telegramUserId);
      
      // Сначала проверяем локальную базу данных
      const dbPartner = await database.getPartner(userId);
      console.log('Partner data from local DB:', dbPartner);
      
      // Проверяем сервер для получения актуальных данных
      try {
        const response = await fetch(`/api/partner/status/${telegramUserId}`);
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
            
            // Удаляем старого партнера, если есть, и добавляем нового
            await database.removePartner(userId);
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
            // Если на сервере нет партнера, удаляем из локальной базы
            await database.removePartner(userId);
            setPartner(null);
          }
        } else {
          // Если сервер недоступен, используем локальные данные
          if (dbPartner && dbPartner.id && dbPartner.partner_name && dbPartner.partner_telegram_id) {
            setPartner(dbPartner);
          } else {
            setPartner(null);
          }
        }
      } catch (serverError) {
        console.error('Error fetching from server:', serverError);
        // Используем локальные данные как fallback
        if (dbPartner && dbPartner.id && dbPartner.partner_name && dbPartner.partner_telegram_id) {
          setPartner(dbPartner);
        } else {
          setPartner(null);
        }
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