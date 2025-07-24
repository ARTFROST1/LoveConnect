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
      // Получаем Telegram ID пользователя для API запроса
      const tgUser = telegramService.user;
      if (!tgUser) {
        console.log('No Telegram user data available for partner sync');
        setPartner(null);
        setIsLoading(false);
        return;
      }
      
      const telegramUserId = tgUser.id.toString();
      
      // Сначала проверяем локальную базу данных
      const dbPartner = await database.getPartner(userId);
      
      // Если есть локальные данные о партнере, используем их
      if (dbPartner && dbPartner.id && dbPartner.partner_name && dbPartner.partner_telegram_id) {
        setPartner(dbPartner);
        setIsLoading(false);
        return; // Не делаем запрос на сервер, если партнер уже есть
      }
      
      // Только если нет локального партнера, проверяем сервер
      try {
        const response = await fetch(`/api/partner/status/${telegramUserId}`);
        if (response.ok) {
          const serverData = await response.json();
          
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
          setPartner(null);
        }
      } catch (serverError) {
        console.error('Error fetching from server:', serverError);
        setPartner(null);
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

    // Only set up polling if user doesn't have a partner yet
    // This helps detect when the inviter accepts the connection
    let interval: NodeJS.Timeout | null = null;
    
    if (!partner) {
      interval = setInterval(() => {
        refreshPartner();
      }, 30000); // Увеличил интервал до 30 секунд для снижения нагрузки
    }

    // Listen for visibility changes to refresh when app becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshPartner();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshPartner, partner]); // Добавил partner в зависимости

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