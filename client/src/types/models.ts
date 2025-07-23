export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface GameQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface ReactionTestResult {
  userTime: number | null;
  partnerTime: number | null;
}

export interface QuestStep {
  id: string;
  text: string;
  choices: { text: string; nextStepId: string }[];
}

export interface DailyChallengeItem {
  id: string;
  title: string;
  description: string;
  type: 'action' | 'photo' | 'text';
}

export interface TruthOrDareItem {
  id: string;
  type: 'truth' | 'dare';
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameStats {
  gamesPlayed: number;
  achievements: number;
  hearts: number;
  winRate: number;
  currentStreak: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  telegramId: string;
}

export interface PartnerProfile extends UserProfile {
  connectedAt: string;
}

export type GameType = 'knowledge-test' | 'reaction-test' | 'paired-quest' | 'daily-challenge' | 'truth-or-dare';

export interface GameConfig {
  id: GameType;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'knowledge' | 'reaction' | 'quest' | 'challenge';
}
