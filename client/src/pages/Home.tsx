import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles } from "lucide-react";
import { database } from "@/lib/database";
import { telegramService } from "@/lib/telegram";
import { GameStats, UserProfile, PartnerProfile } from "@/types/models";
import { usePartnerSync } from "@/hooks/use-partner-sync";
import PartnerProfileModal from "@/components/PartnerProfile";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPartnerProfile, setShowPartnerProfile] = useState(false);
  const [isPartnerOnline, setIsPartnerOnline] = useState(true); // Mock online status
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
      // Get stats
      const gameStats = await database.getGameStats();
      setStats(gameStats);

    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const getDaysTogether = () => {
    if (!partner) return 0;
    const connectedDate = new Date(partner.connectedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - connectedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysPlayingStreak = () => {
    return stats?.currentStreak || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Загружаем...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-sm border-none shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-white animate-pulse-heart" fill="currentColor" />
            </div>
            
            <h2 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">
              Добро пожаловать в DuoLove
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm leading-relaxed">
              Создайте особенную связь с вашим партнёром
            </p>
            
            <Link href="/add-partner">
              <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white py-3 font-medium shadow-lg transition-all duration-200">
                <Sparkles className="w-4 h-4 mr-2" />
                Найти партнёра
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Main couple section */}
      <div className="px-6 pt-12 pb-8">
        <div className="max-w-sm mx-auto">
          
          {/* Avatars and heart */}
          <div className="flex items-center justify-between mb-8 animate-slide-up">
            {/* User Avatar */}
            <button 
              onClick={() => setShowPartnerProfile(true)}
              className="relative group"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105">
                {user?.avatar ? (
                  <img src={user.avatar} alt="You" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white font-medium text-lg">{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              {/* Online status */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 animate-gentle-pulse"></div>
            </button>
            
            {/* Heart in center */}
            <div className="flex-1 flex justify-center">
              <Heart 
                className="w-6 h-6 text-rose-400 animate-pulse-heart" 
                fill="currentColor" 
              />
            </div>
            
            {/* Partner Avatar */}
            <button 
              onClick={() => setShowPartnerProfile(true)}
              className="relative group"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105">
                {partner?.avatar ? (
                  <img src={partner.avatar} alt="Partner" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white font-medium text-lg">{partner?.name?.charAt(0) || 'P'}</span>
                )}
              </div>
              {/* Online status */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${isPartnerOnline ? 'bg-emerald-500 animate-gentle-pulse' : 'bg-gray-400'} rounded-full border-2 border-white dark:border-gray-900`}></div>
            </button>
          </div>
          
          {/* Names */}
          <div className="flex justify-between items-center text-center mb-12">
            <div className="flex-1">
              <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{user?.name || 'Вы'}</p>
            </div>
            <div className="flex-1">
              <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{partner?.name || 'Партнёр'}</p>
            </div>
          </div>
          
          {/* Days together section */}
          <div className="space-y-3 text-center">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Вместе: {getDaysTogether()} дней
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Играем подряд: {getDaysPlayingStreak()} дней
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Partner Profile Modal */}
      {showPartnerProfile && (
        <PartnerProfileModal
          partner={partner}
          isOpen={showPartnerProfile}
          onClose={() => setShowPartnerProfile(false)}
          onDisconnect={() => {
            setShowPartnerProfile(false);
            refreshPartner();
          }}
          totalGames={stats?.gamesPlayed || 0}
          connectionScore={85} // Mock connection score
        />
      )}
    </div>
  );
}