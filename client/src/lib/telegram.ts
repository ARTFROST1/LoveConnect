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

  constructor() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.tg = window.Telegram.WebApp;
      this.initialize();
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

    // Set up back button
    this.tg.BackButton.onClick(() => {
      window.history.back();
    });
  }

  get isAvailable(): boolean {
    return this.tg !== null;
  }

  get user() {
    return this.tg?.initDataUnsafe?.user || null;
  }

  get startParam() {
    return this.tg?.initDataUnsafe?.start_param || null;
  }

  get colorScheme() {
    return this.tg?.colorScheme || 'light';
  }

  showMainButton(text: string, onClick: () => void): void {
    if (!this.tg) return;

    this.tg.MainButton.setText(text);
    this.tg.MainButton.onClick(onClick);
    this.tg.MainButton.show();
  }

  hideMainButton(): void {
    if (!this.tg) return;
    this.tg.MainButton.hide();
  }

  showBackButton(onClick?: () => void): void {
    if (!this.tg) return;

    if (onClick) {
      this.tg.BackButton.onClick(onClick);
    }
    this.tg.BackButton.show();
  }

  hideBackButton(): void {
    if (!this.tg) return;
    this.tg.BackButton.hide();
  }

  hapticFeedback(type: 'impact' | 'notification' | 'selection', style?: string): void {
    if (!this.tg) return;

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
    const botUsername = process.env.VITE_BOT_USERNAME || 'duolove_bot';
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
