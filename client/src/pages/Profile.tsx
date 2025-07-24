import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  Trophy, 
  Gamepad2, 
  Calendar, 
  Clock, 
  Target, 
  Star, 
  Zap,
  Medal,
  Flame,
  Award,
  TrendingUp,
  Camera,
  Users,
  ArrowLeft,
  UserX,
  Settings
} from "lucide-react";
import { database } from "@/lib/database";
import { telegramService } from "@/lib/telegram";
import { UserProfile, PartnerProfile } from "@/types/models";
import { usePartnerSync } from "@/hooks/use-partner-sync";
import { cn } from "@/lib/utils";

interface GameHistoryItem {
  id: number;
  game_type: string;
  user_score: number;
  partner_score: number;
  started_at: string;
  finished_at?: string;
  status: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  progress: number;
  isUnlocked: boolean;
  type: string;
}

interface UserStats {
  gamesPlayed: number;
  achievements: number;
  hearts: number;
  totalPlayTime: number;
  favoriteGame: string;
  averageScore: number;
  streakDays: number;
  maxScore: number;
}

export default function Profile() {
  const [location, navigate] = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [partnerData, setPartnerData] = useState<PartnerProfile | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats>({
    gamesPlayed: 0,
    achievements: 0,
    hearts: 0,
    totalPlayTime: 0,
    favoriteGame: "",
    averageScore: 0,
    streakDays: 0,
    maxScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRemovingPartner, setIsRemovingPartner] = useState(false);
  const { toast } = useToast();

  // Check if we're viewing a partner's profile using route params
  const params = useParams();
  const partnerId = params.partnerId;
  const isViewingPartner = Boolean(partnerId);
  
  // Use the partner sync hook for real-time updates
  const { partner: syncedPartner, isLoading: partnerLoading, refreshPartner } = usePartnerSync(user?.id ? parseInt(user.id) : 0);

  // Convert synced partner to PartnerProfile format
  // Check if syncedPartner is valid (not null and has required properties)
  const partner: PartnerProfile | null = (syncedPartner && 
    syncedPartner.id && 
    syncedPartner.partner_name && 
    syncedPartner.partner_telegram_id) ? {
    id: syncedPartner.id,
    name: syncedPartner.partner_name,
    avatar: syncedPartner.partner_avatar,
    telegramId: syncedPartner.partner_telegram_id,
    connectedAt: syncedPartner.connected_at
  } : null;
  
  // Check if partner relationship still exists when viewing partner profile
  const hasValidPartnerAccess = isViewingPartner ? (partner && partner.telegramId === partnerId) : true;

  useEffect(() => {
    initializeProfile();
  }, [partnerId]);

  const initializeProfile = async () => {
    try {
      setLoading(true);
      
      // Get user from Telegram
      let tgUser = telegramService.user;
      if (!tgUser) {
        console.error('No Telegram user data available');
        // For development, create a mock user
        if (telegramService.isDevelopment) {
          tgUser = {
            id: 123456789,
            first_name: "Тестовый",
            last_name: "Пользователь",
            username: "testuser",
            photo_url: undefined
          };
        } else {
          setLoading(false);
          return;
        }
      }

      // Check if user exists in database
      let dbUser = await database.getUser(tgUser.id.toString());
      
      if (!dbUser) {
        // Create new user
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

      // If viewing partner profile, load partner data
      if (isViewingPartner && partnerId) {
        const partnerInfo = await database.getPartnerByTelegramId(partnerId);
        if (partnerInfo) {
          setPartnerData({
            id: partnerInfo.id,
            name: partnerInfo.partner_name,
            avatar: partnerInfo.partner_avatar,
            telegramId: partnerInfo.partner_telegram_id,
            connectedAt: partnerInfo.connected_at
          });
        } else if (syncedPartner && syncedPartner.partner_telegram_id === partnerId) {
          setPartnerData({
            id: syncedPartner.id,
            name: syncedPartner.partner_name,
            avatar: syncedPartner.partner_avatar,
            telegramId: syncedPartner.partner_telegram_id,
            connectedAt: syncedPartner.connected_at
          });
        }
      }

      // Load game history, achievements, and stats
      await Promise.all([
        loadGameHistory(),
        loadAchievements(),
        loadStats()
      ]);

    } catch (error) {
      console.error('Failed to initialize profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGameHistory = async () => {
    try {
      const history = await database.getAllGameSessions();
      if (isViewingPartner) {
        // Swap scores to show from partner's perspective
        const partnerHistory = history?.map(session => ({
          ...session,
          user_score: session.partner_score,
          partner_score: session.user_score
        })) || [];
        setGameHistory(partnerHistory);
      } else {
        setGameHistory(history || []);
      }
    } catch (error) {
      console.error('Failed to load game history:', error);
      setGameHistory([]);
    }
  };

  const loadAchievements = async () => {
    // Define available achievements
    const allAchievements: Achievement[] = [
      {
        id: "first_game",
        name: "Первая игра",
        description: "Сыграйте свою первую игру",
        icon: Gamepad2,
        progress: 100,
        isUnlocked: true,
        type: "basic"
      },
      {
        id: "games_10",
        name: "Игрок",
        description: "Сыграйте 10 игр",
        icon: Target,
        progress: 70,
        isUnlocked: false,
        type: "progress"
      },
      {
        id: "perfect_score",
        name: "Идеальный результат",
        description: "Наберите максимальный счёт в игре",
        icon: Star,
        progress: 0,
        isUnlocked: false,
        type: "skill"
      },
      {
        id: "streak_7",
        name: "Неделя игр",
        description: "Играйте 7 дней подряд",
        icon: Flame,
        progress: 42,
        isUnlocked: false,
        type: "streak"
      },
      {
        id: "hearts_100",
        name: "Романтик",
        description: "Соберите 100 сердечек",
        icon: Heart,
        progress: 30,
        isUnlocked: false,
        type: "collection"
      },
      {
        id: "partner_bond",
        name: "Крепкая связь",
        description: "Играйте с партнёром 30 дней",
        icon: Users,
        progress: 60,
        isUnlocked: false,
        type: "relationship"
      }
    ];

    setAchievements(allAchievements);
  };

  const loadStats = async () => {
    try {
      const sessions = await database.getAllGameSessions();
      const userAchievements = await database.getUserAchievements(user?.id ? parseInt(user.id) : 0);
      
      if (sessions && sessions.length > 0) {
        const gamesPlayed = sessions.length;
        
        // Calculate stats from appropriate perspective
        const scoreKey = isViewingPartner ? 'partner_score' : 'user_score';
        const totalScore = sessions.reduce((sum: number, session: any) => sum + (session[scoreKey] || 0), 0);
        const averageScore = gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0;
        const maxScore = sessions.reduce((max: number, session: any) => Math.max(max, session[scoreKey] || 0), 0);
        
        // Calculate total play time (mock calculation)
        const totalPlayTime = gamesPlayed * 5; // 5 minutes average per game
        
        // Find most played game
        const gameTypes = sessions.map((s: any) => s.game_type);
        const gameTypeCount: { [key: string]: number } = {};
        gameTypes.forEach((type: string) => {
          gameTypeCount[type] = (gameTypeCount[type] || 0) + 1;
        });
        const favoriteGame = Object.keys(gameTypeCount).reduce((a, b) => 
          gameTypeCount[a] > gameTypeCount[b] ? a : b, ""
        );

        setStats({
          gamesPlayed,
          achievements: isViewingPartner ? 3 : (userAchievements?.length || 0), // Mock partner achievements
          hearts: Math.floor(gamesPlayed * (isViewingPartner ? 2.8 : 2.5)), // Slightly different calculation for partner
          totalPlayTime,
          favoriteGame: getGameDisplayName(favoriteGame),
          averageScore,
          streakDays: isViewingPartner ? 5 : 3, // Mock different streaks
          maxScore
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const getGameDisplayName = (gameType: string): string => {
    const gameNames: { [key: string]: string } = {
      "knowledge-test": "Кто кого лучше знает",
      "reaction-test": "Тест на реакцию",
      "paired-quest": "Парный квест",
      "daily-challenge": "Ежедневный вызов",
      "truth-dare": "Правда или действие"
    };
    return gameNames[gameType] || gameType;
  };

  const getDaysWithPartner = (): number => {
    const relationshipData = isViewingPartner ? partnerData : partner;
    if (!relationshipData) return 0;
    const connectedDate = new Date(relationshipData.connectedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - connectedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handlePartnerClick = () => {
    if (isViewingPartner) {
      // Go back to own profile
      telegramService.hapticFeedback('selection');
      navigate('/profile');
    } else if (partner) {
      // Go to partner profile
      telegramService.hapticFeedback('selection');
      navigate(`/profile/${partner.telegramId}`);
    }
  };

  const handleGoBack = () => {
    telegramService.hapticFeedback('selection');
    if (isViewingPartner) {
      navigate('/profile');
    } else {
      window.history.back();
    }
  };

  const handleRemovePartner = async () => {
    if (!user || !partner) return;
    
    try {
      setIsRemovingPartner(true);
      telegramService.hapticFeedback('impact');
      
      // Send unlink request to server for bilateral disconnection
      try {
        const response = await fetch('/api/unlink-partner', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.telegramId,
            partner_id: partner.telegramId
          })
        });
        
        if (!response.ok) {
          throw new Error('Server unlink failed');
        }
      } catch (serverError) {
        console.warn('Server unlink failed, proceeding with local unlink:', serverError);
      }
      
      // Remove partner from local database
      await database.removePartner(parseInt(user.id));
      
      // Refresh partner state immediately
      await refreshPartner();
      
      // Show success toast
      toast({
        title: "Связь разорвана",
        description: "Вы больше не связаны с партнёром. Вы можете добавить нового.",
        duration: 5000
      });
      
      // Navigate to home page
      setTimeout(() => {
        navigate('/');
      }, 1000);
      
    } catch (error) {
      console.error('Failed to remove partner:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось разорвать связь. Попробуйте снова.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsRemovingPartner(false);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Вчера";
    if (diffDays < 7) return `${diffDays} дня назад`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} недели назад`;
    return `${Math.ceil(diffDays / 30)} месяца назад`;
  };

  const handleAvatarClick = () => {
    telegramService.hapticFeedback('selection');
    // Here you could implement avatar change functionality
    console.log('Avatar clicked - implement avatar change');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загружаем профиль...</p>
        </div>
      </div>
    );
  }

  // Block access to partner profile if relationship no longer exists
  if (isViewingPartner && !hasValidPartnerAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Профиль недоступен
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Этот пользователь больше не состоит в паре с вами
            </p>
            <Button onClick={() => navigate('/profile')} className="w-full">
              Вернуться к профилю
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine the profile data to display
  const displayProfile = isViewingPartner ? partnerData : user;
  const relationshipPartner = isViewingPartner ? user : partner;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header with Back Button (only for partner profile) */}
        {isViewingPartner && (
          <div className="bg-white dark:bg-gray-800 pt-4 pb-2 px-4 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
          </div>
        )}

        {/* Profile Header */}
        <div className={`bg-white dark:bg-gray-800 pb-6 px-6 rounded-b-3xl shadow-sm relative ${isViewingPartner ? '' : 'pt-8'}`}>
          {/* Settings button - only for own profile */}
          {!isViewingPartner && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 p-2"
              onClick={() => {
                telegramService.hapticFeedback('selection');
                // For now, just show a toast - can implement settings later
                toast({
                  title: "Настройки",
                  description: "Функция настроек будет добавлена в следующем обновлении",
                  duration: 3000
                });
              }}
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
          {/* Profile Avatar and Info */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={displayProfile?.avatar || ""} alt={displayProfile?.name || ""} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  {displayProfile?.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              {/* Only show camera button for own profile */}
              {!isViewingPartner && (
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-primary hover:bg-primary/90"
                  onClick={handleAvatarClick}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {displayProfile?.name || (isViewingPartner ? "Партнёр" : "Пользователь")}
            </h1>
            
            {/* Online status for partner */}
            {isViewingPartner && (
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Онлайн</span>
              </div>
            )}
            
            {/* Relationship Info */}
            {relationshipPartner ? (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mx-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">В отношениях с</p>
                <div 
                  className="flex items-center justify-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handlePartnerClick}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={relationshipPartner.avatar || ""} alt={relationshipPartner.name} />
                    <AvatarFallback className="text-xs">
                      {relationshipPartner.name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-white">{relationshipPartner.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getDaysWithPartner()} дней вместе
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {isViewingPartner ? "Данные недоступны" : "Партнёр не добавлен"}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 mt-6">
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="stats" className="text-xs">Статистика</TabsTrigger>
              <TabsTrigger value="achievements" className="text-xs">Достижения</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">История игр</TabsTrigger>
            </TabsList>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="space-y-4">
              {/* Main Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="text-center">
                  <CardContent className="p-4">
                    <Gamepad2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.gamesPlayed}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Игр сыграно</p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-4">
                    <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.achievements}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Достижений</p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-4">
                    <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.hearts}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Сердечек</p>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Stats */}
              <div className="space-y-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Общее время игр</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{stats.totalPlayTime} минут</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {stats.favoriteGame && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Star className="w-5 h-5 text-orange-500" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Любимая игра</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{stats.favoriteGame}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Средний счёт</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{stats.averageScore} очков</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Flame className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Серия игр</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{stats.streakDays} дней подряд</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {stats.maxScore > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Award className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Максимум очков</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{stats.maxScore} в одной игре</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-4">
              <div className="space-y-3">
                {achievements
                  .sort((a, b) => {
                    // Sort unlocked achievements first
                    if (a.isUnlocked && !b.isUnlocked) return -1;
                    if (!a.isUnlocked && b.isUnlocked) return 1;
                    return b.progress - a.progress;
                  })
                  .map((achievement) => {
                    const IconComponent = achievement.icon;
                    return (
                      <Card 
                        key={achievement.id} 
                        className={cn(
                          "transition-all duration-200",
                          achievement.isUnlocked 
                            ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800" 
                            : "bg-gray-50 dark:bg-gray-800 opacity-75"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className={cn(
                              "p-3 rounded-full",
                              achievement.isUnlocked 
                                ? "bg-yellow-100 dark:bg-yellow-900/30" 
                                : "bg-gray-200 dark:bg-gray-700"
                            )}>
                              <IconComponent 
                                className={cn(
                                  "w-6 h-6",
                                  achievement.isUnlocked 
                                    ? "text-yellow-600 dark:text-yellow-400" 
                                    : "text-gray-400 dark:text-gray-500"
                                )}
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className={cn(
                                  "font-semibold",
                                  achievement.isUnlocked 
                                    ? "text-gray-900 dark:text-white" 
                                    : "text-gray-600 dark:text-gray-400"
                                )}>
                                  {achievement.name}
                                </h3>
                                {achievement.isUnlocked && (
                                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                    Открыто!
                                  </Badge>
                                )}
                              </div>
                              
                              <p className={cn(
                                "text-sm mb-3",
                                achievement.isUnlocked 
                                  ? "text-gray-700 dark:text-gray-300" 
                                  : "text-gray-500 dark:text-gray-400"
                              )}>
                                {achievement.description}
                              </p>
                              
                              {!achievement.isUnlocked && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">Прогресс</span>
                                    <span className="text-gray-500 dark:text-gray-400">{achievement.progress}%</span>
                                  </div>
                                  <Progress value={achievement.progress} className="h-2" />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>

            {/* Game History Tab */}
            <TabsContent value="history" className="space-y-4">
              {gameHistory.length > 0 ? (
                <div className="space-y-3">
                  {gameHistory.map((game) => (
                    <Card key={game.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Gamepad2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {getGameDisplayName(game.game_type)}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatTimeAgo(game.started_at)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-2 text-sm">
                              <span className={cn(
                                "font-semibold",
                                game.user_score > game.partner_score 
                                  ? "text-green-600 dark:text-green-400" 
                                  : game.user_score < game.partner_score 
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-600 dark:text-gray-400"
                              )}>
                                {game.user_score}
                              </span>
                              <span className="text-gray-400">:</span>
                              <span className="font-semibold text-gray-600 dark:text-gray-400">
                                {game.partner_score}
                              </span>
                            </div>
                            <Badge 
                              variant={game.status === "completed" ? "default" : "secondary"}
                              className="text-xs mt-1"
                            >
                              {game.status === "completed" ? "Завершена" : "Активна"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Gamepad2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      История игр пуста
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Сыграйте свою первую игру, чтобы увидеть результаты здесь
                    </p>
                    <Button size="sm" asChild>
                      <a href="/games">Начать играть</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Disconnect Partner Section - Only shown on user's own profile and when partner exists */}
        {!isViewingPartner && partner && (
          <div className="px-4 mt-8 mb-8">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:border-red-700"
                    disabled={isRemovingPartner}
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    {isRemovingPartner ? "Разрываем связь..." : "Разорвать связь с партнёром"}
                  </Button>
                </AlertDialogTrigger>
                
                <AlertDialogContent className="max-w-sm mx-auto">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-center">
                      Разорвать связь?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                      Вы уверены, что хотите разорвать связь с партнёром <strong>{partner.name}</strong>?
                      <br /><br />
                      Это действие удалит текущую пару, и вы оба снова увидите экран добавления партнёра.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <AlertDialogFooter className="flex-col space-y-2 sm:flex-col sm:space-x-0 sm:space-y-2">
                    <AlertDialogAction
                      onClick={handleRemovePartner}
                      className="w-full bg-red-500 hover:bg-red-600 text-white order-2"
                      disabled={isRemovingPartner}
                    >
                      {isRemovingPartner ? "Разрываем..." : "Разорвать"}
                    </AlertDialogAction>
                    <AlertDialogCancel className="w-full order-1" disabled={isRemovingPartner}>
                      Отмена
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}