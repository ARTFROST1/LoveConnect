import { useEffect, useState } from 'react';
import { telegramService } from '@/lib/telegram';
import { database } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

export interface InviteProcessingResult {
  isProcessing: boolean;
  inviteProcessed: boolean;
  error: string | null;
}

export function useInviteProcessing(): InviteProcessingResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [inviteProcessed, setInviteProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    processInviteIfPresent();
  }, []);

  const processInviteIfPresent = async () => {
    try {
      // Check if we have invite parameters
      const startParam = telegramService.startParam;
      
      if (!startParam || !startParam.startsWith('invite_')) {
        return;
      }

      setIsProcessing(true);
      setError(null);

      // Extract inviter's user ID from start parameter
      const inviterUserId = startParam.replace('invite_', '');
      
      // Get current user data
      const currentUser = telegramService.user;
      if (!currentUser) {
        throw new Error('No user data available for processing invite');
      }

      // Initialize database if needed
      await database.initialize();

      // Create/get current user in database
      let dbUser = await database.getUser(currentUser.id.toString());
      if (!dbUser) {
        dbUser = await database.createUser(
          currentUser.id.toString(),
          `${currentUser.first_name} ${currentUser.last_name || ''}`.trim(),
          currentUser.photo_url || null
        );
      }

      // Check if partner relationship already exists
      const existingPartner = await database.getPartner(dbUser.id);
      if (existingPartner) {
        console.log('Partner relationship already exists');
        setInviteProcessed(true);
        return;
      }

      // For invite processing, we need to create a bidirectional relationship
      // Since we only have the inviter's Telegram ID, we'll use it to create the partnership
      
      // Create partner relationship for current user -> inviter
      await database.addPartner(
        dbUser.id,
        inviterUserId,
        `Пользователь ${inviterUserId}`, // We don't have the inviter's full name
        null // No avatar available
      );

      // Show success notification
      toast({
        title: "Партнёр добавлен!",
        description: "Вы успешно подключились к партнёру. Теперь можете играть вместе!",
      });

      // Trigger haptic feedback
      telegramService.hapticFeedback('notification', 'success');

      setInviteProcessed(true);
      
      console.log('Invite processed successfully:', {
        currentUserId: currentUser.id,
        inviterUserId,
        partnershipCreated: true
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось обработать приглашение';
      console.error('Error processing invite:', err);
      setError(errorMessage);
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    inviteProcessed,
    error
  };
}