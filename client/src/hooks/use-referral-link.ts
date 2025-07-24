import { useState, useEffect } from 'react';
import { telegramService } from '@/lib/telegram';
import { useToast } from '@/hooks/use-toast';

export interface ReferralLinkResult {
  referralLink: string | null;
  referralCode: string | null;
  isLoading: boolean;
  error: string | null;
  copyLink: () => void;
  regenerateCode: () => Promise<void>;
}

export function useReferralLink(): ReferralLinkResult {
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateReferralLink = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/referral/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate referral link');
      }

      const result = await response.json();
      setReferralCode(result.referralCode);
      setReferralLink(result.referralLink);
      setIsLoading(false);

      return result;
    } catch (err) {
      console.error('Error generating referral link:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
      throw err;
    }
  };

  const copyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast({
        title: "Скопировано!",
        description: "Реферальная ссылка скопирована в буфер обмена",
      });
    }
  };

  const regenerateCode = async () => {
    const currentUser = telegramService.user;
    if (!currentUser) {
      toast({
        title: "Ошибка",
        description: "Данные пользователя не найдены",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateReferralLink(currentUser.id.toString());
      toast({
        title: "Код обновлен!",
        description: "Новый реферальный код сгенерирован",
      });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Не удалось сгенерировать новый код",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const initializeReferralLink = async () => {
      try {
        await telegramService.waitForInitialization();
        const currentUser = telegramService.user;
        
        if (!currentUser) {
          throw new Error('User data not available');
        }

        await generateReferralLink(currentUser.id.toString());
      } catch (err) {
        console.error('Error initializing referral link:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    initializeReferralLink();
  }, []);

  return {
    referralLink,
    referralCode,
    isLoading,
    error,
    copyLink,
    regenerateCode,
  };
}