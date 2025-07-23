export interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isProgressVisible: boolean;
    isActive: boolean;
    setText(text: string): void;
    onClick(callback: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
  };
  BackButton: {
    isVisible: boolean;
    onClick(callback: () => void): void;
    show(): void;
    hide(): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
    };
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  onEvent(eventType: string, eventHandler: () => void): void;
  offEvent(eventType: string, eventHandler: () => void): void;
  sendData(data: string): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

class TelegramService {
  private tg: TelegramWebApp | null = null;
  private isDevelopment: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      if (window.Telegram?.WebApp) {
        this.tg = window.Telegram.WebApp;
        console.log('Telegram WebApp found:', {
          version: this.tg.version,
          initData: this.tg.initData,
          initDataUnsafe: this.tg.initDataUnsafe
        });
        this.initialize();
      } else {
        // Development mode - create mock user data
        this.isDevelopment = true;
        console.log('Running in development mode - using mock Telegram data');
      }
    }
  }

  private initialize(): void {
    if (!this.tg) return;

    this.tg.ready();
    this.tg.expand();

    // Apply dark mode based on Telegram theme
    if (this.tg.colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // Set up back button if supported
    if (this.tg.BackButton) {
      this.tg.BackButton.onClick(() => {
        window.history.back();
      });
    }
  }

  get isAvailable(): boolean {
    return this.tg !== null || this.isDevelopment;
  }

  get user() {
    if (this.tg?.initDataUnsafe?.user) {
      return this.tg.initDataUnsafe.user;
    }
    
    // Development fallback
    if (this.isDevelopment) {
      return {
        id: 123456789,
        first_name: "Тестовый",
        last_name: "Пользователь",
        username: "test_user",
        language_code: "ru",
        photo_url: null
      };
    }
    
    return null;
  }

  get startParam() {
    if (this.tg?.initDataUnsafe?.start_param) {
      return this.tg.initDataUnsafe.start_param;
    }
    
    // Check URL params for development
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tgWebAppStartParam') || null;
  }

  get colorScheme() {
    return this.tg?.colorScheme || 'light';
  }

  showMainButton(text: string, onClick: () => void): void {
    if (this.tg) {
      this.tg.MainButton.setText(text);
      this.tg.MainButton.onClick(onClick);
      this.tg.MainButton.show();
    }
    // In development mode, we don't show the button but log it
    else if (this.isDevelopment) {
      console.log(`Main button would show: ${text}`);
    }
  }

  hideMainButton(): void {
    if (this.tg) {
      this.tg.MainButton.hide();
    }
  }

  showBackButton(onClick?: () => void): void {
    if (this.tg && this.tg.BackButton) {
      if (onClick) {
        this.tg.BackButton.onClick(onClick);
      }
      this.tg.BackButton.show();
    }
  }

  hideBackButton(): void {
    if (this.tg && this.tg.BackButton) {
      this.tg.BackButton.hide();
    }
  }

  hapticFeedback(type: 'impact' | 'notification' | 'selection', style?: string): void {
    if (this.tg) {
      switch (type) {
        case 'impact':
          this.tg.HapticFeedback.impactOccurred(style as any || 'medium');
          break;
        case 'notification':
          this.tg.HapticFeedback.notificationOccurred(style as any || 'success');
          break;
        case 'selection':
          this.tg.HapticFeedback.selectionChanged();
          break;
      }
    }
    // In development mode, just log the feedback
    else if (this.isDevelopment) {
      console.log(`Haptic feedback: ${type} ${style || ''}`);
    }
  }

  close(): void {
    if (!this.tg) return;
    this.tg.close();
  }

  sendData(data: any): void {
    if (!this.tg) return;
    this.tg.sendData(JSON.stringify(data));
  }

  generateInviteLink(userId: string): string {
    // This would use the actual bot username from environment
    const botUsername = import.meta.env.VITE_BOT_USERNAME || 'duolove_bot';
    return `https://t.me/${botUsername}?start=invite_${userId}`;
  }

  async shareInviteLink(link: string): Promise<void> {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Присоединяйся к DuoLove!',
          text: 'Давай играть в мини-игры вместе!',
          url: link,
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(link);
        // Show notification
        this.hapticFeedback('notification', 'success');
      }
    } catch (error) {
      console.error('Failed to share invite link:', error);
    }
  }
}

export const telegramService = new TelegramService();
