import TelegramBot from 'node-telegram-bot-api';

class DuoLoveTelegramBot {
  private bot: TelegramBot | null = null;
  private webAppUrl: string;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    // Use the new working Replit dev URL
    this.webAppUrl = process.env.WEBAPP_URL || 
      'https://a14f2b3f-23b7-4c7f-9880-b16a8d739822-00-3bbojmz63mcbx.spock.replit.dev';
    
    console.log('Telegram Bot: Initializing...');
    console.log('Environment:', this.isDevelopment ? 'development' : 'production');
    console.log('WebApp URL:', this.webAppUrl);
    console.log('Full WebApp URL for BotFather:', this.webAppUrl);
    
    // Initialize bot if we have a token
    this.initializeBot();
  }

  private initializeBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      if (this.isDevelopment) {
        console.log('Telegram Bot: Running in development mode (no real bot required)');
        return;
      }
      console.error('TELEGRAM_BOT_TOKEN is not set');
      return;
    }

    try {
      this.bot = new TelegramBot(token, { 
        polling: true,
        baseApiUrl: 'https://api.telegram.org'
      });
      this.setupCommands();
      console.log('Telegram Bot initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Telegram Bot:', error);
    }
  }

  private setupCommands() {
    if (!this.bot) return;

    // Handle /start command with invite parameters
    this.bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const user = msg.from;
      const startParam = match?.[1];

      console.log('Received /start command:', {
        chatId,
        userId: user?.id,
        username: user?.username,
        startParam
      });

      if (startParam && startParam.startsWith('invite_')) {
        await this.handleInviteLink(chatId, user, startParam);
      } else {
        await this.handleRegularStart(chatId, user);
      }
    });

    // Handle errors
    this.bot.on('error', (error) => {
      console.error('Telegram Bot error:', error);
    });

    // Handle polling errors
    this.bot.on('polling_error', (error) => {
      console.error('Telegram Bot polling error:', error);
    });
  }

  private async handleInviteLink(chatId: number, user: any, startParam: string) {
    if (!this.bot) return;

    const inviterUserId = startParam.replace('invite_', '');
    
    console.log('Processing invite link:', {
      inviterUserId,
      inviteeUserId: user?.id,
      inviteeUsername: user?.username
    });

    try {
      // Create WebApp URL with start parameter to ensure it's passed properly
      const webAppUrlWithParam = `${this.webAppUrl}?start=${startParam}`;
      
      const keyboard = {
        inline_keyboard: [[
          {
            text: '🎮 Открыть DuoLove',
            web_app: { url: webAppUrlWithParam }
          }
        ]]
      };

      await this.bot.sendMessage(chatId, 
        `🎉 Вас пригласили играть в DuoLove!\n\n` +
        `Откройте приложение, чтобы подключиться к партнёру и начать играть в мини-игры вместе.\n\n` +
        `После подключения ваш партнёр получит уведомление о том, что вы приняли приглашение.`,
        {
          reply_markup: keyboard,
          parse_mode: 'HTML'
        }
      );

    } catch (error) {
      console.error('Error handling invite link:', error);
      await this.bot.sendMessage(chatId, 
        'Произошла ошибка при обработке приглашения. Попробуйте позже.'
      );
    }
  }

  private async handleRegularStart(chatId: number, user: any) {
    if (!this.bot) return;

    try {
      const webAppUrl = this.webAppUrl;
      
      const keyboard = {
        inline_keyboard: [[
          {
            text: '🎮 Открыть DuoLove',
            web_app: { url: webAppUrl }
          }
        ]]
      };

      await this.bot.sendMessage(chatId, 
        `👋 Добро пожаловать в DuoLove!\n\n` +
        `🎮 Играйте в мини-игры вместе с партнёром\n` +
        `💝 Укрепляйте отношения через игры\n` +
        `🏆 Получайте достижения и награды\n\n` +
        `Нажмите кнопку ниже, чтобы начать:`,
        {
          reply_markup: keyboard,
          parse_mode: 'HTML'
        }
      );

    } catch (error) {
      console.error('Error handling regular start:', error);
      await this.bot.sendMessage(chatId, 
        'Произошла ошибка. Попробуйте позже.'
      );
    }
  }

  // Method to set webhook (for production)
  async setWebhook(webhookUrl: string) {
    if (!this.bot) {
      console.error('Bot is not initialized');
      return false;
    }

    try {
      await this.bot.setWebHook(webhookUrl);
      console.log('Webhook set successfully:', webhookUrl);
      return true;
    } catch (error) {
      console.error('Failed to set webhook:', error);
      return false;
    }
  }

  // Method to delete webhook (for development with polling)
  async deleteWebhook() {
    if (!this.bot) {
      console.error('Bot is not initialized');
      return false;
    }

    try {
      await this.bot.deleteWebHook();
      console.log('Webhook deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      return false;
    }
  }

  // Get bot info
  async getBotInfo() {
    if (!this.bot) {
      return null;
    }

    try {
      const me = await this.bot.getMe();
      return me;
    } catch (error) {
      console.error('Failed to get bot info:', error);
      return null;
    }
  }

  // Method to generate invite link
  async generateInviteLink(userId: string): Promise<string> {
    try {
      // Get bot info to get the actual username
      const botInfo = await this.getBotInfo();
      const botUsername = botInfo?.username || 'duolove_bot';
      
      return `https://t.me/${botUsername}?start=invite_${userId}`;
    } catch (error) {
      console.error('Error generating invite link:', error);
      // Fallback - the user provided bot token suggests the username
      return `https://t.me/duolove_bot?start=invite_${userId}`;
    }
  }

  // Method to notify partner connection
  async notifyPartnerConnection(inviterUserId: string, inviteeUserId: string, inviteeName: string): Promise<void> {
    if (!this.bot) {
      if (this.isDevelopment) {
        console.log(`[DEV] Would notify user ${inviterUserId} that ${inviteeName} (${inviteeUserId}) connected`);
        return;
      }
      console.error('Bot is not initialized');
      return;
    }

    try {
      const keyboard = {
        inline_keyboard: [[
          {
            text: '🎮 Открыть DuoLove',
            web_app: { url: this.webAppUrl }
          }
        ]]
      };

      await this.bot.sendMessage(parseInt(inviterUserId), 
        `🎉 Партнёрство установлено!\n\n` +
        `${inviteeName} принял ваше приглашение и готов играть!\n\n` +
        `Откройте DuoLove, чтобы начать игру вместе.`,
        {
          reply_markup: keyboard,
          parse_mode: 'HTML'
        }
      );

      console.log(`Partner connection notification sent to user ${inviterUserId}`);
    } catch (error) {
      console.error('Error sending partner connection notification:', error);
    }
  }

  // Method to notify partner disconnection
  async notifyPartnerDisconnection(userId: string, partnerId: string): Promise<void> {
    if (!this.bot) {
      if (this.isDevelopment) {
        console.log(`[DEV] Would notify user ${partnerId} that ${userId} disconnected`);
        return;
      }
      console.error('Bot is not initialized');
      return;
    }

    try {
      const keyboard = {
        inline_keyboard: [[
          {
            text: '🎮 Открыть DuoLove',
            web_app: { url: this.webAppUrl }
          }
        ]]
      };

      await this.bot.sendMessage(parseInt(partnerId), 
        `💔 Партнёрство завершено\n\n` +
        `Ваш партнёр разорвал связь в DuoLove.\n\n` +
        `Вы можете добавить нового партнёра и продолжить играть.`,
        {
          reply_markup: keyboard,
          parse_mode: 'HTML'
        }
      );

      console.log(`Partner disconnection notification sent to user ${partnerId}`);
    } catch (error) {
      console.error('Error sending partner disconnection notification:', error);
    }
  }
}

export const telegramBot = new DuoLoveTelegramBot();