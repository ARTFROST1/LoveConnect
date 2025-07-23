import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Heart, Flame, Crown, Medal } from "lucide-react";
import { database } from "@/lib/database";
import { GameStats } from "@/types/models";

interface Achievement {
  type: string;
  name: string;
  icon: string;
  color: string;
}

const achievementTypes: Record<string, Achievement> = {
  first_game: { type: 'first_game', name: 'Первая игра', icon: 'trophy', color: 'accent' },
  hearts_100: { type: 'hearts_100', name: '100 сердечек', icon: 'heart', color: 'primary' },
  week_streak: { type: 'week_streak', name: 'Неделя подряд', icon: 'fire', color: 'secondary' },
  knowledge_master: { type: 'knowledge_master', name: 'Знаток', icon: 'crown', color: 'purple' },
  reaction_champion: { type: 'reaction_champion', name: 'Молния', icon: 'medal', color: 'yellow' }
};

export default function History() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      setLoading(true);

      // Load stats
      const gameStats = await database.getGameStats();
      setStats(gameStats);

      // Load game history
      const history = await database.getGameHistory(20);
      setGameHistory(history);

      // Load achievements (mock for now)
      const mockAchievements = [
        { type: 'first_game', unlocked_at: new Date().toISOString() },
        { type: 'hearts_100', unlocked_at: new Date().toISOString() },
        { type: 'week_streak', unlocked_at: new Date().toISOString() }
      ];
      setAchievements(mockAchievements);

    } catch (error) {
      console.error('Failed to load history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGameName = (gameType: string) => {
    switch (gameType) {
      case 'knowledge-test': return 'Кто кого лучше знает';
      case 'reaction-test': return 'Тест на реакцию';
      case 'paired-quest': return 'Парный квест';
      case 'daily-challenge': return 'Задание дня';
      case 'truth-or-dare': return 'Правда или действие';
      default: return gameType;
    }
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

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'trophy': return Trophy;
      case 'heart': return Heart;
      case 'fire': return Flame;
      case 'crown': return Crown;
      case 'medal': return Medal;
      default: return Trophy;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary': return 'bg-primary/20 text-primary';
      case 'secondary': return 'bg-secondary/20 text-secondary';
      case 'accent': return 'bg-accent/20 text-accent';
      case 'purple': return 'bg-purple-500/20 text-purple-500';
      case 'yellow': return 'bg-yellow-500/20 text-yellow-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Stats Overview */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Ваша статистика
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats?.gamesPlayed || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Всего игр</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">{stats?.hearts || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Сердечек</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{stats?.winRate || 0}%</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Побед</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{stats?.currentStreak || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Дней подряд</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Достижения</h3>
          <div className="grid grid-cols-3 gap-3">
            {achievements.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
                Пока нет достижений
              </div>
            ) : (
              achievements.map((achievement, index) => {
                const config = achievementTypes[achievement.type];
                if (!config) return null;
                
                const IconComponent = getAchievementIcon(config.icon);
                
                return (
                  <Card key={index}>
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${getColorClasses(config.color)}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-medium text-gray-800 dark:text-gray-100">
                        {config.name}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Game History */}
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">История игр</h3>
          <div className="space-y-3">
            {gameHistory.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500 dark:text-gray-400">
                  Пока нет сыгранных игр
                </CardContent>
              </Card>
            ) : (
              gameHistory.map((game, index) => {
                const userWon = game.user_score > game.partner_score;
                const isTie = game.user_score === game.partner_score;
                
                return (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800 dark:text-gray-100">
                          {getGameName(game.game_type)}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(game.finished_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className={`text-sm font-bold ${userWon ? 'text-green-500' : isTie ? 'text-gray-500' : 'text-gray-400'}`}>
                              {game.user_score}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Вы</div>
                          </div>
                          
                          <div className="text-center">
                            <div className={`text-sm font-bold ${!userWon && !isTie ? 'text-green-500' : isTie ? 'text-gray-500' : 'text-gray-400'}`}>
                              {game.partner_score}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Партнёр</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {userWon ? (
                            <>
                              <Crown className="w-4 h-4 text-accent" />
                              <span className="text-sm text-accent font-medium">+15</span>
                            </>
                          ) : isTie ? (
                            <>
                              <Medal className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500 font-medium">+5</span>
                            </>
                          ) : (
                            <>
                              <Medal className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500 font-medium">+8</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
