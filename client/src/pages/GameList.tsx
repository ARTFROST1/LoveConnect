import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Bolt, Map, Calendar, Users, ChevronRight } from "lucide-react";
import { telegramService } from "@/lib/telegram";
import { GameConfig } from "@/types/models";

const gameConfigs: GameConfig[] = [
  {
    id: 'knowledge-test',
    name: 'Кто кого лучше знает',
    description: '5 вопросов о партнёре',
    icon: 'brain',
    color: 'primary',
    category: 'knowledge'
  },
  {
    id: 'reaction-test',
    name: 'Тест на реакцию',
    description: 'Кто быстрее нажмёт кнопку',
    icon: 'bolt',
    color: 'secondary',
    category: 'reaction'
  },
  {
    id: 'paired-quest',
    name: 'Парный квест',
    description: 'Пошаговый сюжет с выбором',
    icon: 'map',
    color: 'accent',
    category: 'quest'
  },
  {
    id: 'daily-challenge',
    name: 'Задание дня',
    description: 'Весёлое действие или челлендж',
    icon: 'calendar',
    color: 'green',
    category: 'challenge'
  },
  {
    id: 'truth-or-dare',
    name: 'Правда или действие',
    description: 'Классическая игра онлайн',
    icon: 'users',
    color: 'purple',
    category: 'challenge'
  }
];

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'brain': return Brain;
    case 'bolt': return Bolt;
    case 'map': return Map;
    case 'calendar': return Calendar;
    case 'users': return Users;
    default: return Brain;
  }
};

const getColorClasses = (color: string) => {
  switch (color) {
    case 'primary': return 'border-primary text-primary bg-primary/20';
    case 'secondary': return 'border-secondary text-secondary bg-secondary/20';
    case 'accent': return 'border-accent text-accent bg-accent/20';
    case 'green': return 'border-green-500 text-green-500 bg-green-500/20';
    case 'purple': return 'border-purple-500 text-purple-500 bg-purple-500/20';
    default: return 'border-primary text-primary bg-primary/20';
  }
};

const getBorderColor = (color: string) => {
  switch (color) {
    case 'primary': return 'border-l-primary';
    case 'secondary': return 'border-l-secondary';
    case 'accent': return 'border-l-accent';
    case 'green': return 'border-l-green-500';
    case 'purple': return 'border-l-purple-500';
    default: return 'border-l-primary';
  }
};

export default function GameList() {
  const [, setLocation] = useLocation();

  const handleGameSelect = (gameId: string) => {
    telegramService.hapticFeedback('selection');
    setLocation(`/game/${gameId}`);
  };

  const categorizedGames = {
    knowledge: gameConfigs.filter(game => game.category === 'knowledge'),
    reaction: gameConfigs.filter(game => game.category === 'reaction'),
    quest: gameConfigs.filter(game => game.category === 'quest'),
    challenge: gameConfigs.filter(game => game.category === 'challenge')
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Выберите игру
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Веселитесь и узнавайте друг друга лучше
          </p>
        </div>

        {/* Game Categories */}
        <div className="space-y-6">
          {/* Knowledge Games */}
          <div className="category-section">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
              <Brain className="w-5 h-5 text-primary mr-2" />
              Узнавание
            </h3>
            <div className="space-y-3">
              {categorizedGames.knowledge.map((game) => {
                const IconComponent = getIcon(game.icon);
                return (
                  <Card 
                    key={game.id}
                    className={`cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 ${getBorderColor(game.color)}`}
                    onClick={() => handleGameSelect(game.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColorClasses(game.color)}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                              {game.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {game.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Reaction Games */}
          <div className="category-section">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
              <Bolt className="w-5 h-5 text-secondary mr-2" />
              Реакция
            </h3>
            <div className="space-y-3">
              {categorizedGames.reaction.map((game) => {
                const IconComponent = getIcon(game.icon);
                return (
                  <Card 
                    key={game.id}
                    className={`cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 ${getBorderColor(game.color)}`}
                    onClick={() => handleGameSelect(game.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColorClasses(game.color)}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                              {game.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {game.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Quest Games */}
          <div className="category-section">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
              <Map className="w-5 h-5 text-accent mr-2" />
              Квесты
            </h3>
            <div className="space-y-3">
              {categorizedGames.quest.map((game) => {
                const IconComponent = getIcon(game.icon);
                return (
                  <Card 
                    key={game.id}
                    className={`cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 ${getBorderColor(game.color)}`}
                    onClick={() => handleGameSelect(game.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColorClasses(game.color)}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                              {game.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {game.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Challenge Games */}
          <div className="category-section">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
              <Calendar className="w-5 h-5 text-green-500 mr-2" />
              Задания
            </h3>
            <div className="space-y-3">
              {categorizedGames.challenge.map((game, index) => {
                const IconComponent = getIcon(game.icon);
                return (
                  <Card 
                    key={game.id}
                    className={`cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 ${getBorderColor(game.color)} relative`}
                    onClick={() => handleGameSelect(game.id)}
                  >
                    {index === 0 && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Новое!
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColorClasses(game.color)}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                              {game.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {game.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
