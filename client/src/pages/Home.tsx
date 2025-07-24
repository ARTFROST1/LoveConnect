import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Play, RefreshCw, Sparkles, Target, Clock, Star, Brain, Zap, Gift } from "lucide-react";
import { database } from "@/lib/database";
import { telegramService } from "@/lib/telegram";
import { UserProfile, PartnerProfile } from "@/types/models";
import { usePartnerSync } from "@/hooks/use-partner-sync";
import { useReferralProcessing } from "@/hooks/use-referral-processing";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  // Реферальная система - обработка входящих реферальных ссылок
  const { isProcessing: referralProcessing, referralProcessed } = useReferralProcessing();

  // Use unified partner sync for consistent partner management
  // Pass local user ID for database operations, but hook will use Telegram ID for API calls
  const { partner: syncedPartner, isLoading: partnerLoading, refreshPartner } = usePartnerSync(user?.id ? parseInt(user.id) : 0);

  // Convert synced partner to PartnerProfile format
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

      // No need to load stats and history for home page anymore

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

  const handleUserAvatarClick = () => {
    telegramService.hapticFeedback('selection');
    navigate('/profile');
  };

  const handlePartnerAvatarClick = () => {
    if (partner) {
      telegramService.hapticFeedback('selection');
      navigate(`/profile/${partner.telegramId}`);
    }
  };

  // Carousel suggestions data
  const suggestions = [
    {
      id: 1,
      title: "Откройте новое задание",
      description: "Попробуйте что-то новенькое вместе",
      icon: Sparkles,
      gradient: "from-purple-400 to-pink-400",
      link: "/games"
    },
    {
      id: 2,
      title: "Попробуйте парный квест",
      description: "Совместное приключение ждёт вас",
      icon: Target,
      gradient: "from-blue-400 to-cyan-400",
      link: "/games?highlight=paired-quest"
    },
    {
      id: 3,
      title: "Сыграйте за 3 минуты",
      description: "Быстрая игра для хорошего настроения",
      icon: Clock,
      gradient: "from-green-400 to-emerald-400",
      link: "/games?highlight=reaction-test"
    },
    {
      id: 4,
      title: "Сегодняшний челлендж",
      description: "Ежедневная доза веселья и близости",
      icon: Star,
      gradient: "from-orange-400 to-red-400",
      link: "/games?highlight=daily-challenge"
    }
  ];

  // Recommended games data
  const recommendedGames = [
    {
      id: 1,
      title: "Новинка недели",
      description: "Кто кого лучше знает",
      icon: Brain,
      link: "/games?highlight=knowledge-test",
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      id: 2,
      title: "Лучшее для пар",
      description: "Тест на реакцию",
      icon: Zap,
      link: "/games?highlight=reaction-test",
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      id: 3,
      title: "Классика",
      description: "Правда или действие",
      icon: Gift,
      link: "/games?highlight=truth-or-dare",
      color: "bg-gradient-to-br from-pink-500 to-pink-600"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
                <div 
                  className="w-12 h-12 bg-primary rounded-full flex items-center justify-center border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleUserAvatarClick}
                >
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
                <div 
                  className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center border-2 border-secondary cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handlePartnerAvatarClick}
                >
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
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Вместе делаем каждый день особенным
                </span>
              </div>
              
              {/* Partner Status Indicator */}
              <div className="flex items-center justify-center mt-3 space-x-2">
                {partner ? (
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>✓ Партнёр подключён</span>
                  </div>
                ) : partnerLoading ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center space-x-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Загружаем данные...</span>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/add-partner')}
                    className="text-primary border-primary hover:bg-primary hover:text-white transition-colors text-xs py-1 px-3"
                  >
                    Найти партнёра
                  </Button>
                )}
                {!partnerLoading && (
                  <button 
                    onClick={refreshPartner}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2"
                    disabled={partnerLoading}
                  >
                    <RefreshCw className={`w-3 h-3`} />
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggestion Carousel */}
      <div className="px-4 mb-6">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-lg">Что попробовать сегодня?</h3>
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={16}
          slidesPerView={1.2}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          className="suggestion-swiper"
        >
          {suggestions.map((suggestion) => {
            const IconComponent = suggestion.icon;
            return (
              <SwiperSlide key={suggestion.id}>
                <Link href={suggestion.link}>
                  <Card className="h-full bg-gradient-to-br border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer overflow-hidden">
                    <CardContent className={`p-6 bg-gradient-to-br ${suggestion.gradient} text-white relative`}>
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full -ml-8 -mb-8"></div>
                      <div className="relative z-10">
                        <IconComponent className="w-8 h-8 mb-3 text-white/90" />
                        <h4 className="font-bold text-lg mb-2">{suggestion.title}</h4>
                        <p className="text-sm text-white/80 leading-relaxed">{suggestion.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
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

      {/* Recommended Games */}
      <div className="px-4 mb-20">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 text-lg">Рекомендуем попробовать</h3>
        <div className="grid grid-cols-2 gap-4">
          {recommendedGames.slice(0, 2).map((game) => {
            const IconComponent = game.icon;
            return (
              <Link key={game.id} href={game.link}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer border-none shadow-md">
                  <CardContent className={`p-4 ${game.color} text-white relative overflow-hidden h-full`}>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                    <div className="relative z-10 flex flex-col h-full">
                      <IconComponent className="w-6 h-6 mb-2 text-white/90" />
                      <h4 className="font-bold text-sm mb-1">{game.title}</h4>
                      <p className="text-xs text-white/80 flex-1">{game.description}</p>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="mt-3 bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs"
                      >
                        Открыть
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        
        {/* Third game takes full width */}
        {recommendedGames[2] && (() => {
          const IconComponent = recommendedGames[2].icon;
          return (
            <div className="mt-4">
              <Link href={recommendedGames[2].link}>
                <Card className="hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer border-none shadow-md">
                  <CardContent className={`p-4 ${recommendedGames[2].color} text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full -ml-8 -mb-8"></div>
                    <div className="relative z-10 flex items-center space-x-4">
                      <IconComponent className="w-8 h-8 text-white/90 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-bold text-base mb-1">{recommendedGames[2].title}</h4>
                        <p className="text-sm text-white/80">{recommendedGames[2].description}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        Открыть
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
