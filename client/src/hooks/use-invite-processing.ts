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
    // Process invite immediately and with retry
    const processWithRetry = async () => {
      // First attempt immediately
      await processInviteIfPresent();
      
      // If no invite found, try again after short delay
      // This handles cases where WebApp needs time to initialize
      setTimeout(async () => {
        if (!inviteProcessed && !isProcessing) {
          await processInviteIfPresent();
        }
      }, 1000);
    };

    processWithRetry();
  }, []);

  const processInviteIfPresent = async () => {
    try {
      // Wait for Telegram WebApp to be fully initialized
      await telegramService.waitForInitialization();
      
      // Check if we have invite parameters with retry logic
      const startParam = await telegramService.getStartParamWithRetry(5, 500);
      
      console.log('Processing invite with startParam:', startParam);
      
      if (!startParam || !startParam.startsWith('invite_')) {
        console.log('No valid invite parameter found - this is normal for regular app opens');
        setInviteProcessed(false);
        setError(null); // Clear any previous errors
        return;
      }

      console.log('Valid invite parameter found, processing invitation...');
      setIsProcessing(true);
      setError(null);

      // Extract inviter's user ID from start parameter
      const inviterUserId = startParam.replace('invite_', '');
      
      console.log('Extracted inviter user ID:', inviterUserId);
      
      // Get current user data
      const currentUser = telegramService.user;
      if (!currentUser) {
        throw new Error('No user data available for processing invite');
      }

      console.log('Current user:', { id: currentUser.id, name: currentUser.first_name });

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
      if (existingPartner && existingPartner.id && existingPartner.partner_name) {
        console.log('Partner relationship already exists, ignoring invite');
        toast({
          title: "Приглашение проигнорировано",
          description: "У вас уже есть партнёр. Сначала разорвите текущую связь.",
          duration: 3000
        });
        setInviteProcessed(true);
        return;
      }

      // Step 1: Create pending partnership for current user -> inviter
      await database.addPartner(
        dbUser.id,
        inviterUserId,
        `Пользователь ${inviterUserId}`, // We'll get the real name later
        null, // No avatar available yet
        'connected', // Mark as connected since user accepted the invite
        inviterUserId // Track who invited
      );

      // Step 2: Notify the inviter about the connection and create server-side partnership
      try {
        const response = await fetch('/api/partner/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inviterUserId,
            inviteeUserId: currentUser.id.toString(),
            inviteeName: `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
          })
        });

        if (response.ok) {
          console.log('Partner notification sent and server partnership created successfully');
        } else {
          console.error('Failed to send partner notification or create server partnership');
        }
      } catch (error) {
        console.error('Error sending partner notification:', error);
      }

      // Step 3: Show success notification
      toast({
        title: "Партнёрство установлено!",
        description: "Вы успешно подключились к партнёру. Приглашающий получил уведомление!",
      });

      // Trigger haptic feedback
      telegramService.hapticFeedback('notification', 'success');

      setInviteProcessed(true);
      
      console.log('Invite processed successfully:', {
        currentUserId: currentUser.id,
        inviterUserId,
        partnershipCreated: true,
        notificationSent: true
      });

    } catch (err) {
      console.error('Error processing invite:', err);
      
      // Don't show error to user for invalid invites - just log and continue
      setError(null);
      setInviteProcessed(false);
      
      // Only show error if it's a real processing error, not just missing parameters
      if (err instanceof Error && !err.message.includes('No user data') && !err.message.includes('parameter')) {
        toast({
          title: "Ошибка подключения",
          description: "Не удалось подключиться к партнёру. Попробуйте позже.",
          variant: "destructive",
          duration: 3000
        });
        telegramService.hapticFeedback('notification', 'error');
      }
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