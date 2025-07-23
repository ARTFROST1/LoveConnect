import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { GameConfig } from "@/types/models";

interface GameCardProps {
  game: GameConfig;
  onClick: () => void;
  isNew?: boolean;
}

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

export default function GameCard({ game, onClick, isNew = false }: GameCardProps) {
  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 ${getBorderColor(game.color)} relative`}
      onClick={onClick}
    >
      {isNew && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          Новое!
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${getColorClasses(game.color)}`}>
              <i className={`fas fa-${game.icon} text-sm`}></i>
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
}
