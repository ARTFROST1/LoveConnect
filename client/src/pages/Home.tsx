import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trophy, Flame, Play, RefreshCw, Calendar, Star, Users, Gift } from "lucide-react";
import { database } from "@/lib/database";
import { telegramService } from "@/lib/telegram";
import { GameStats, UserProfile, PartnerProfile } from "@/types/models";
import { usePartnerSync } from "@/hooks/use-partner-sync";
import PartnerProfile from "@/components/PartnerProfile";
import HeartGift from "@/components/HeartGift";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [connectionScore, setConnectionScore] = useState<number>(0);
  const [canGiftHeart, setCanGiftHeart] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [showPartnerProfile, setShowPartnerProfile] = useState(false);
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
      loadHeartStatus();
      loadConnectionScore();
      loadActivities();
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

  const loadHeartStatus = async () => {
    if (!user || !partner) return;
    
    try {
      const canGift = await database.canGiftHeartToday(Number(user.id), partner.id);
      setCanGiftHeart(canGift);
    } catch (error) {
      console.error('Failed to load heart status:', error);
    }
  };

  const loadConnectionScore = async () => {
    if (!user) return;
    
    try {
      const score = await database.getConnectionScore(Number(user.id));
      setConnectionScore(score);
    } catch (error) {
      console.error('Failed to load connection score:', error);
    }
  };

  const loadActivities = async () => {
    if (!user) return;
    
    try {
      const activities = await database.getRecentActivities(Number(user.id), 3);
      setRecentActivities(activities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleHeartGifted = () => {
    setCanGiftHeart(false);
    loadConnectionScore();
    loadActivities();
    
    // Add haptic feedback if available
    if (telegramService.isAvailable) {
      telegramService.hapticFeedback('medium');
    }
  };

  const handleDisconnectPartner = async () => {
    if (!user) return;
    
    try {
      await database.removePartner(Number(user.id));
      await database.addActivity(
        Number(user.id),
        'partner_disconnected',
        'Разорвали связь с партнёром'
      );
      
      // Refresh partner data to update UI
      refreshPartner();
      
      toast({
        title: "Связь разорвана",
        description: "Вы больше не связаны с партнёром"
      });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загружаем...</p>
        </div>
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
      {/* Partner Connection Header */}
      <div className="p-4">
        <Card className="bg-gradient-to-br from-primary/10 via-white to-secondary/10 dark:from-primary/10 dark:via-gray-800 dark:to-secondary/10 border-none shadow-lg">
          <CardContent className="p-6">
            {/* Partner Avatars with Connection Animation */}
            <div className="flex items-center space-x-4 mb-4">
              {/* User Avatar */}
              <div className="relative">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center border-3 border-white dark:border-gray-800 shadow-lg">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="User" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xl">{user?.name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              
              {/* Animated Heart Connection */}
              <div className="flex-1 flex items-center justify-center">
                <div className="relative">
                  <Heart className="w-8 h-8 text-red-500 animate-pulse" fill="currentColor" />
                  <div className="absolute inset-0 animate-ping">
                    <Heart className="w-8 h-8 text-red-300 opacity-75" fill="currentColor" />
                  </div>
                </div>
              </div>
              
              {/* Partner Avatar - Clickable */}
              <div className="relative">
                <button
                  onClick={() => setShowPartnerProfile(true)}
                  className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center border-3 border-white dark:border-gray-800 shadow-lg transform hover:scale-105 transition-all duration-200 active:scale-95"
                >
                  {partner?.avatar ? (
                    <img src={partner.avatar} alt="Partner" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xl">{partner?.name?.charAt(0) || 'P'}</span>
                  )}
                </button>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Connection Info */}
            <div className="text-center mb-4">
              <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-1">
                {user?.name} & {partner?.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Играете вместе {getDaysPlaying()} дней
              </p>
              
              {/* Connection Score */}
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  Связь: {connectionScore}/100
                </span>
              </div>
              
              {/* Heart Gift Button */}
              <div className="flex items-center justify-center space-x-3">
                <HeartGift
                  userId={Number(user.id)}
                  partnerId={partner.id}
                  partnerName={partner.name}
                  canGiftToday={canGiftHeart}
                  onHeartGifted={handleHeartGifted}
                />
                
                {/* Refresh Button */}
                <button 
                  onClick={refreshPartner}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={partnerLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${partnerLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Grid */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">{stats?.gamesPlayed || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Игр сыграно</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-500">{stats?.currentStreak || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Дней подряд</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" fill="currentColor" />
              <div className="text-2xl font-bold text-red-500">{stats?.hearts || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Сердечек</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Action Button */}
      <div className="px-4 mb-6">
        <Link href="/games">
          <Button className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 rounded-xl">
            <Play className="w-6 h-6 mr-3" />
            Начать игру
          </Button>
        </Link>
      </div>

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <div className="px-4 mb-6">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Последние активности
          </h4>
          <div className="space-y-2">
            {recentActivities.map((activity, index) => (
              <Card key={index} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    {activity.type === 'heart_gifted' && <Gift className="w-4 h-4 text-pink-500" />}
                    {activity.type === 'game_completed' && <Trophy className="w-4 h-4 text-primary" />}
                    {activity.type === 'achievement_unlocked' && <Star className="w-4 h-4 text-yellow-500" />}
                    {activity.type === 'partner_connected' && <Users className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-100">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Game History */}
      <div className="px-4 mb-20">
        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
          <Trophy className="w-4 h-4 mr-2" />
          Последние игры
        </h4>
        <div className="space-y-3">
          {gameHistory.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Начните первую игру вместе!</p>
              </CardContent>
            </Card>
          ) : (
            gameHistory.map((game, index) => (
              <Card key={index} className="hover:shadow-sm transition-shadow">
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

      {/* Partner Profile Modal */}
      {partner && (
        <PartnerProfile
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