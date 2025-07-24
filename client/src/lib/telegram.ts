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
  public isDevelopment: boolean = false;
  private isInitialized: boolean = false;

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
        this.isInitialized = true;
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

    // Log initial state for debugging
    console.log('Telegram WebApp initialized:', {
      version: this.tg.version,
      initData: this.tg.initData,
      initDataUnsafe: this.tg.initDataUnsafe,
      startParam: this.tg.initDataUnsafe?.start_param
    });

    this.isInitialized = true;
  }

  // Wait for Telegram WebApp to be fully initialized
  async waitForInitialization(maxWaitMs: number = 3000): Promise<boolean> {
    if (this.isInitialized) return true;
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (this.isInitialized || (Date.now() - startTime) > maxWaitMs) {
          clearInterval(checkInterval);
          resolve(this.isInitialized);
        }
      }, 100);
    });
  }

  get isAvailable(): boolean {
    return this.tg !== null || this.isDevelopment;
  }

  get user() {
    // Try to get user from Telegram WebApp
    if (this.tg?.initDataUnsafe?.user) {
      return this.tg.initDataUnsafe.user;
    }
    
    // Development fallback with more realistic data
    if (this.isDevelopment) {
      // Check if we have a different user in URL params for testing invite links
      const urlParams = new URLSearchParams(window.location.search);
      const testUserId = urlParams.get('testUserId');
      
      if (testUserId) {
        return {
          id: parseInt(testUserId),
          first_name: "Пользователь",
          last_name: testUserId,
          username: `user_${testUserId}`,
          language_code: "ru",
          photo_url: null
        };
      }
      
      return {
        id: 123456789,
        first_name: "Тестовый",
        last_name: "Пользователь",
        username: "test_user",
        language_code: "ru",
        photo_url: null
      };
    }
    
    console.log("No Telegram user data available");
    return null;
  }

  get startParam() {
    // Method 1: Check fragment (hash) parameters - primary method for WebApp
    const hash = window.location.hash.substring(1);
    if (hash) {
      // Direct check for start parameter in hash
      if (hash.startsWith('start=')) {
        const hashStart = hash.replace('start=', '');
        console.log('Found start_param from hash (direct):', hashStart);
        return hashStart;
      }
    }
    
    // Method 2: Try to get from Telegram WebApp initDataUnsafe
    if (this.tg?.initDataUnsafe?.start_param) {
      console.log('Found start_param from Telegram WebApp:', this.tg.initDataUnsafe.start_param);
      return this.tg.initDataUnsafe.start_param;
    }
    
    // Method 3: Check URL params as fallback
    const urlParams = new URLSearchParams(window.location.search);
    let startParam = urlParams.get('tgWebAppStartParam') || urlParams.get('start') || null;
    
    // In development mode, also check for manually added invite parameter
    if (!startParam && this.isDevelopment) {
      startParam = urlParams.get('invite') || null;
    }
    
    if (startParam) {
      console.log('Found start_param from URL:', startParam);
    }
    
    return startParam;
  }

  // Get start param with retry logic for better reliability
  async getStartParamWithRetry(maxRetries: number = 3, delayMs: number = 500): Promise<string | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Attempt ${attempt}: Checking for start_param`, {
        hasTelegram: !!this.tg,
        initDataUnsafe: this.tg?.initDataUnsafe || {},
        urlParams: window.location.search
      });

      // Method 1: Check Telegram WebApp initDataUnsafe
      if (this.tg?.initDataUnsafe?.start_param) {
        console.log('Found start_param in initDataUnsafe:', this.tg.initDataUnsafe.start_param);
        return this.tg.initDataUnsafe.start_param;
      }

      // Method 2: Check URL parameters (fallback)
      const urlParams = new URLSearchParams(window.location.search);
      const startFromUrl = urlParams.get('start');
      if (startFromUrl) {
        console.log('Found start param in URL:', startFromUrl);
        return startFromUrl;
      }

      // Method 3: Check for invited_by parameter (alternative format)
      const invitedBy = urlParams.get('invited_by');
      if (invitedBy) {
        console.log('Found invited_by param in URL:', invitedBy);
        return `invite_${invitedBy}`;
      }

      // Method 4: Check fragment (hash) parameters - primary method for WebApp
      const hash = window.location.hash.substring(1);
      if (hash) {
        // Direct check for start parameter in hash
        if (hash.startsWith('start=')) {
          const hashStart = hash.replace('start=', '');
          console.log('Found start param in hash (direct):', hashStart);
          return hashStart;
        }
        
        // Alternative check using URLSearchParams
        const hashParams = new URLSearchParams(hash);
        const hashStart = hashParams.get('start');
        if (hashStart) {
          console.log('Found start param in hash (URLSearchParams):', hashStart);
          return hashStart;
        }
      }

      // Wait before next attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Log current state for debugging
        console.log(`Attempt ${attempt + 1}: Checking for start_param`, {
          hasTelegram: !!this.tg,
          initDataUnsafe: this.tg?.initDataUnsafe,
          urlParams: window.location.search
        });
      }
    }
    
    return null;
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

  async generateInviteLink(userId: string): Promise<string> {
    if (this.isDevelopment) {
      // In development, generate a link that can be tested in the same app
      const currentUrl = window.location.origin;
      return `${currentUrl}?start=invite_${userId}&testUserId=${parseInt(userId) + 1}`;
    }
    
    try {
      // Use server API to generate invite link
      const response = await fetch('/api/invite/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate invite link');
      }
      
      const data = await response.json();
      return data.inviteLink;
    } catch (error) {
      console.error('Error generating invite link:', error);
      // Fallback to manual generation
      const botUsername = import.meta.env.VITE_BOT_USERNAME || 'duolove_bot';
      return `https://t.me/${botUsername}?start=invite_${userId}`;
    }
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
