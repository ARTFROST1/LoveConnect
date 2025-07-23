import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trophy, Flame, Play, RefreshCw } from "lucide-react";
import { database } from "@/lib/database";
import { telegramService } from "@/lib/telegram";
import { GameStats, UserProfile, PartnerProfile } from "@/types/models";
import { usePartnerSync } from "@/hooks/use-partner-sync";

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Use the partner sync hook for real-time updates
  const { partner: syncedPartner, isLoading: partnerLoading, refreshPartner } = usePartnerSync(user?.id || 0);

  // Convert synced partner to PartnerProfile format
  const partner: PartnerProfile | null = syncedPartner ? {
    id: syncedPartner.id,
    name: syncedPartner.partner_name,
    avatar: syncedPartner.partner_avatar,
    telegramId: syncedPartner.partner_telegram_id,
    connectedAt: syncedPartner.connected_at
  } : null;

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      setLoading(true);
      
      // Get user from Telegram
      const tgUser = telegramService.user;
      if (!tgUser) {
        console.error('No Telegram user data available');
        setLoading(false);
        return;
      }

      // Check if user exists in database
      let dbUser = await database.getUser(tgUser.id.toString());
      
      if (!dbUser) {
        // Create new user
        console.log('Creating user with data:', {
          id: tgUser.id.toString(),
          name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
          avatar: tgUser.photo_url
        });
        
        dbUser = await database.createUser(
          tgUser.id.toString(),
          `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
          tgUser.photo_url === undefined ? null : tgUser.photo_url
        );
      }

      setUser({
        id: dbUser.id,
        name: dbUser.name,
        avatar: dbUser.avatar,
        telegramId: dbUser.telegram_id
      });

      // Partner will be handled by usePartnerSync hook
      // Trigger a refresh to get the latest partner data
      setTimeout(() => refreshPartner(), 100);

      // Get stats and history
      const gameStats = await database.getGameStats();
      setStats(gameStats);

      const history = await database.getGameHistory(5);
      setGameHistory(history);

    } catch (error) {
      console.error('Failed to initialize user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysPlaying = () => {
    if (!partner) return 0;
    const connectedDate = new Date(partner.connectedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - connectedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Только что';
    if (diffHours < 24) return `${diffHours}ч назад`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}д назад`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Добро пожаловать в DuoLove!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Добавьте партнёра, чтобы начать играть в мини-игры вместе
            </p>
            <Link href="/add-partner">
              <Button className="w-full bg-gradient-to-r from-primary to-secondary text-white">
                Добавить партнёра
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Partner Status Card */}
      <div className="p-4">
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              {/* User Avatar */}
              <div className="relative">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center border-2 border-primary">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="User" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-semibold">{user?.name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
              
              {/* Heart Connection */}
              <div className="flex-1 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary animate-pulse" fill="currentColor" />
              </div>
              
              {/* Partner Avatar */}
              <div className="relative">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center border-2 border-secondary">
                  {partner?.avatar ? (
                    <img src={partner.avatar} alt="Partner" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-semibold">{partner?.name?.charAt(0) || 'P'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                {user?.name} & {partner?.name || 'Партнёр'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Играете вместе {getDaysPlaying()} дней
              </p>
              <div className="flex items-center justify-center mt-2 space-x-2">
                <Flame className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">
                  {stats?.currentStreak || 0} дней подряд
                </span>
              </div>
              
              {/* Partner Status Indicator */}
              <div className="flex items-center justify-center mt-3 space-x-2">
                <div className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Партнёр подключён</span>
                </div>
                {partnerLoading && (
                  <RefreshCw className="w-3 h-3 text-gray-400 animate-spin" />
                )}
                <button 
                  onClick={refreshPartner}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2"
                  disabled={partnerLoading}
                >
                  <RefreshCw className={`w-3 h-3 ${partnerLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats?.gamesPlayed || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Игр сыграно</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">{stats?.achievements || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Достижений</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">{stats?.hearts || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Сердечек</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Start Game Button */}
      <div className="px-4 mb-6">
        <Link href="/games">
          <Button className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-4 text-lg shadow-lg transform hover:scale-105 transition-all duration-200">
            <Play className="w-5 h-5 mr-2" />
            Начать игру
          </Button>
        </Link>
      </div>

      {/* Recent Activities */}
      <div className="px-4 mb-20">
        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Последние активности</h4>
        <div className="space-y-3">
          {gameHistory.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center text-gray-500 dark:text-gray-400">
                Пока нет сыгранных игр
              </CardContent>
            </Card>
          ) : (
            gameHistory.map((game, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {game.game_type === 'knowledge-test' && 'Кто кого лучше знает'}
                      {game.game_type === 'reaction-test' && 'Тест на реакцию'}
                      {game.game_type === 'paired-quest' && 'Парный квест'}
                      {game.game_type === 'daily-challenge' && 'Задание дня'}
                      {game.game_type === 'truth-or-dare' && 'Правда или действие'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Вы: {game.user_score}, Партнёр: {game.partner_score}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTimeAgo(game.finished_at)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
