import { useEffect, useState } from 'react';
import { telegramService } from '@/lib/telegram';
import { database } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

export interface ReferralProcessingResult {
  isProcessing: boolean;
  referralProcessed: boolean;
  error: string | null;
}

export function useReferralProcessing(): ReferralProcessingResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [referralProcessed, setReferralProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const processReferralCode = async () => {
      try {
        // Ждем инициализации Telegram WebApp
        await telegramService.waitForInitialization();
        
        // Получаем реферальный код из Telegram WebApp startapp параметра
        let referralCode = null;
        
        // Проверяем startapp параметр из Telegram WebApp
        const tgWebApp = (window as any).Telegram?.WebApp;
        if (tgWebApp?.initDataUnsafe?.start_param) {
          referralCode = tgWebApp.initDataUnsafe.start_param;
          console.log('Found referral code from Telegram startapp:', referralCode);
        }
        
        // Fallback: проверяем URL параметры (для тестирования)
        if (!referralCode) {
          const urlParams = new URLSearchParams(window.location.search);
          referralCode = urlParams.get('ref');
          console.log('Checking for referral code in URL params:', referralCode);
        }
        
        console.log('Final referral code:', referralCode);
        
        if (!referralCode) {
          console.log('No referral code found - regular app open');
          setReferralProcessed(false);
          setError(null);
          return;
        }

        console.log('Valid referral code found, processing...');
        setIsProcessing(true);
        setError(null);

        // Получаем данные текущего пользователя
        const currentUser = telegramService.user;
        if (!currentUser) {
          throw new Error('No user data available');
        }

        console.log('Current user:', { id: currentUser.id, name: currentUser.first_name });

        // Проверяем, не пытается ли пользователь использовать свой собственный реферальный код  
        if (referralCode.includes(`ref_${currentUser.id}_`)) {
          console.log('User trying to use their own referral code - ignoring');
          setReferralProcessed(false);
          setIsProcessing(false);
          return;
        }

        // Инициализируем базу данных
        await database.initialize();

        // Проверяем, есть ли уже партнер
        const existingPartner = await database.getPartner(1); // ID текущего пользователя
        if (existingPartner) {
          console.log('User already has a partner, skipping referral processing');
          setReferralProcessed(true);
          setIsProcessing(false);
          return;
        }

        // Отправляем запрос на сервер для обработки реферального кода
        const response = await fetch('/api/referral/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            referralCode: referralCode,
            userId: currentUser.id.toString(),
            userName: currentUser.first_name || `Пользователь ${currentUser.id}`
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process referral');
        }

        const result = await response.json();
        console.log('Referral processed successfully:', result);

        // Создаем партнерство локально
        if (result.partnership) {
          console.log('Creating local partnership:', result.partnership);
          
          const newPartner = {
            userId: 1,
            partnerTelegramId: result.partnership.referrerId,
            partnerName: result.partnership.referrerName || `Пользователь ${result.partnership.referrerId}`,
            partnerAvatar: null,
            connectedAt: new Date().toISOString(),
            status: 'connected' as const,
            referralConnectionId: result.partnership.connectionId
          };

          console.log('Adding partner to local database:', newPartner);
          
          await database.addPartner(
            newPartner.userId,
            newPartner.partnerTelegramId,
            newPartner.partnerName,
            newPartner.partnerAvatar,
            newPartner.connectedAt,
            newPartner.status
          );
          
          console.log('Partner added successfully to local database');
        }

        setReferralProcessed(true);
        setIsProcessing(false);

        // Показываем сообщение об успехе
        toast({
          title: "Подключение установлено!",
          description: `Вы успешно подключились к партнёру по реферальной ссылке!`,
        });

        // Очищаем URL от реферального параметра (только если это был URL параметр)
        if (window.location.search.includes('ref=')) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('ref');
          window.history.replaceState({}, document.title, newUrl.toString());
        }

      } catch (err) {
        console.error('Error processing referral:', err);
        
        setError(null);
        setReferralProcessed(false);
        
        if (err instanceof Error) {
          toast({
            title: "Ошибка подключения",
            description: err.message,
            variant: "destructive",
          });
          setError(err.message);
        }
        
        setIsProcessing(false);
      }
    };

    processReferralCode();
  }, []);

  return {
    isProcessing,
    referralProcessed,
    error
  };
}