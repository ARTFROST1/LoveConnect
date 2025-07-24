import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trophy, Flame, Play, RefreshCw, Calendar, Star, Gift, Sparkles, Clock } from "lucide-react";
import { database } from "@/lib/database";
import { telegramService } from "@/lib/telegram";
import { GameStats, UserProfile, PartnerProfile } from "@/types/models";
import { usePartnerSync } from "@/hooks/use-partner-sync";
import PartnerProfileModal from "@/components/PartnerProfile";
import HeartGift from "@/components/HeartGift";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPartnerProfile, setShowPartnerProfile] = useState(false);
  const [connectionScore, setConnectionScore] = useState(0);
  const [canGiftToday, setCanGiftToday] = useState(true);
  const [receivedHearts, setReceivedHearts] = useState<any[]>([]);
  const { toast } = useToast();

  // Use the partner sync hook for real-time updates
  const { partner: syncedPartner, isLoading: partnerLoading, refreshPartner } = usePartnerSync(user?.id ? Number(user.id) : 0);

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

  useEffect(() => {
    if (user && partner) {
      loadUserData();
    }
  }, [user, partner]);

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

    } catch (error) {
      console.error('Failed to initialize user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!user || !partner) return;

    try {
      // Get stats and history
      const gameStats = await database.getGameStats();
      setStats(gameStats);

      const history = await database.getGameHistory(5);
      setGameHistory(history);

      // Get recent activities
      const recentActivities = await database.getRecentActivities(Number(user.id), 3);
      setActivities(recentActivities);

      // Get connection score
      const score = await database.getConnectionScore(Number(user.id));
      setConnectionScore(score);

      // Check if can gift heart today
      const canGift = await database.canGiftHeartToday(Number(user.id), Number(partner.id));
      setCanGiftToday(canGift);

      // Get received hearts
      const hearts = await database.getReceivedHearts(Number(user.id), 3);
      setReceivedHearts(hearts);

    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleHeartGifted = () => {
    setCanGiftToday(false);
    loadUserData(); // Refresh data
    
    // Trigger haptic feedback
    if (telegramService.isAvailable) {
      telegramService.hapticFeedback("notification");
    }
  };

  const handleDisconnectPartner = async () => {
    if (!user) return;
    
    try {
      await database.removePartner(Number(user.id));
      toast({
        title: "Связь разорвана",
        description: "Партнёр успешно отключён"
      });
      
      // Refresh partner data
      refreshPartner();
    } catch (error) {
      console.error('Failed to disconnect partner:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось разорвать связь",
        variant: "destructive"
      });
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

  const getConnectionStatusColor = () => {
    if (connectionScore >= 80) return "text-pink-500";
    if (connectionScore >= 60) return "text-purple-500";
    if (connectionScore >= 40) return "text-blue-500";
    return "text-green-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загружаем ваш мир любви...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-purple-900">
        <Card className="w-full max-w-md border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-pink-400 via-purple-400 to-red-400 rounded-full flex items-center justify-center relative overflow-hidden">
              <Heart className="w-16 h-16 text-white animate-pulse" fill="currentColor" />
              <div className="absolute inset-0 bg-gradient-to-br from-pink-300/30 to-purple-300/30 animate-pulse"></div>
            </div>
            
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Добро пожаловать в DuoLove!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Создайте особенную связь с вашим партнёром через игры, задания и моменты внимания
            </p>
            
            <Link href="/add-partner">
              <Button className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-red-500 hover:from-pink-600 hover:via-purple-600 hover:to-red-600 text-white py-4 text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200">
                <Sparkles className="w-5 h-5 mr-2" />
                Найти партнёра
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      {/* Partner Connection Card */}
      <div className="p-4 pb-0">
        <Card className="bg-gradient-to-br from-white/90 to-pink-50/90 dark:from-gray-800/90 dark:to-purple-900/90 border-none shadow-lg backdrop-blur-sm">
          <CardContent className="p-6">
            {/* User and Partner Avatars */}
            <div className="flex items-center justify-between mb-6">
              {/* User Avatar */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="User" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xl">{user?.name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 animate-pulse"></div>
              </div>
              
              {/* Animated Connection */}
              <div className="flex-1 flex items-center justify-center px-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-red-400 animate-pulse"></div>
                  <Heart className={`w-8 h-8 ${getConnectionStatusColor()} animate-bounce`} fill="currentColor" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></div>
                </div>
              </div>
              
              {/* Partner Avatar - Clickable */}
              <button
                onClick={() => setShowPartnerProfile(true)}
                className="relative transform hover:scale-105 transition-all duration-200"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                  {partner?.avatar ? (
                    <img src={partner.avatar} alt="Partner" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xl">{partner?.name?.charAt(0) || 'P'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 animate-pulse"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </button>
            </div>
            
            {/* Names and Status */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {user?.name} & {partner?.name || 'Партнёр'}
              </h3>
              
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {getDaysPlaying()} дней вместе
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {stats?.currentStreak || 0} дней подряд
                  </span>
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="mt-3">
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-2 h-2 ${getConnectionStatusColor().replace('text-', 'bg-')} rounded-full animate-pulse`}></div>
                  <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
                    Связь: {connectionScore}%
                  </span>
                  {partnerLoading && (
                    <RefreshCw className="w-3 h-3 text-gray-400 animate-spin ml-2" />
                  )}
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${connectionScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Heart Gift Button */}
            <div className="flex justify-center">
              <HeartGift
                userId={Number(user?.id || 0)}
                partnerId={Number(partner.id)}
                partnerName={partner.name}
                canGiftToday={canGiftToday}
                onHeartGifted={handleHeartGifted}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white/80 dark:bg-gray-800/80 border-none shadow-md backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.gamesPlayed || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Игр сыграно</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 border-none shadow-md backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats?.achievements || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Достижений</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 border-none shadow-md backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-pink-600">{receivedHearts.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Сердечек</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Start Game Button */}
      <div className="px-4 mb-4">
        <Link href="/games">
          <Button className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-semibold py-4 text-lg shadow-lg transform hover:scale-105 transition-all duration-200">
            <Play className="w-5 h-5 mr-2" />
            Начать игру
          </Button>
        </Link>
      </div>

      {/* Recent Activities & History */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-1 gap-4">
          {/* Recent Activities */}
          {activities.length > 0 && (
            <Card className="bg-white/80 dark:bg-gray-800/80 border-none shadow-md backdrop-blur-sm">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-purple-500" />
                  Последние активности
                </h4>
                <div className="space-y-2">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                        {activity.description}
                      </p>
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Game History */}
          <Card className="bg-white/80 dark:bg-gray-800/80 border-none shadow-md backdrop-blur-sm">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
                Последние игры
              </h4>
              <div className="space-y-3">
                {gameHistory.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    <Star className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Начните играть, чтобы увидеть историю</p>
                  </div>
                ) : (
                  gameHistory.map((game, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
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
                          Вы: {game.user_score} • Партнёр: {game.partner_score}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTimeAgo(game.finished_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-20"></div>

      {/* Partner Profile Modal */}
      {partner && (
        <PartnerProfileModal
          partner={partner}
          isOpen={showPartnerProfile}
          onClose={() => setShowPartnerProfile(false)}
          totalGames={stats?.gamesPlayed || 0}
          connectionScore={connectionScore}
          onDisconnect={handleDisconnectPartner}
        />
      )}
    </div>
  );
}