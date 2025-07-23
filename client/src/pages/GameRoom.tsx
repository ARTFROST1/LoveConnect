import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { database } from "@/lib/database";
import { telegramService } from "@/lib/telegram";
import { GameType } from "@/types/models";

// Import game components
import KnowledgeTest from "@/components/games/KnowledgeTest";
import ReactionTest from "@/components/games/ReactionTest";
import PairedQuest from "@/components/games/PairedQuest";
import DailyChallenge from "@/components/games/DailyChallenge";
import TruthOrDare from "@/components/games/TruthOrDare";

export default function GameRoom() {
  const [match, params] = useRoute("/game/:gameId");
  const [gameSession, setGameSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const gameId = params?.gameId as GameType;

  useEffect(() => {
    if (gameId) {
      initializeGame();
      telegramService.showBackButton();
    }

    return () => {
      telegramService.hideBackButton();
    };
  }, [gameId]);

  const initializeGame = async () => {
    try {
      setLoading(true);
      
      // Create new game session
      const session = await database.createGameSession(gameId);
      setGameSession(session);

      // Setup Telegram WebApp for game
      telegramService.hapticFeedback('selection');
      
    } catch (error) {
      console.error('Failed to initialize game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameComplete = async (userScore: number, partnerScore: number) => {
    if (!gameSession) return;

    try {
      await database.updateGameSession(gameSession.id, userScore, partnerScore);
      
      // Add achievement for first game
      const stats = await database.getGameStats();
      if (stats.gamesPlayed === 1) {
        await database.addAchievement(1, 'first_game'); // Assume user ID 1 for now
      }

      telegramService.hapticFeedback('notification', 'success');
    } catch (error) {
      console.error('Failed to complete game:', error);
    }
  };

  const renderGame = () => {
    if (!gameSession) return null;

    switch (gameId) {
      case 'knowledge-test':
        return <KnowledgeTest sessionId={gameSession.id} onComplete={handleGameComplete} />;
      case 'reaction-test':
        return <ReactionTest sessionId={gameSession.id} onComplete={handleGameComplete} />;
      case 'paired-quest':
        return <PairedQuest sessionId={gameSession.id} onComplete={handleGameComplete} />;
      case 'daily-challenge':
        return <DailyChallenge sessionId={gameSession.id} onComplete={handleGameComplete} />;
      case 'truth-or-dare':
        return <TruthOrDare sessionId={gameSession.id} onComplete={handleGameComplete} />;
      default:
        return (
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold mb-4">Игра не найдена</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Запрошенная игра не существует или недоступна.
              </p>
              <Link href="/games">
                <Button>Вернуться к списку игр</Button>
              </Link>
            </CardContent>
          </Card>
        );
    }
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Игра не найдена</h2>
            <Link href="/games">
              <Button>Вернуться к списку игр</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка игры...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/games">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {gameId === 'knowledge-test' && 'Кто кого лучше знает'}
            {gameId === 'reaction-test' && 'Тест на реакцию'}
            {gameId === 'paired-quest' && 'Парный квест'}
            {gameId === 'daily-challenge' && 'Задание дня'}
            {gameId === 'truth-or-dare' && 'Правда или действие'}
          </h1>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Game Content */}
      <div className="max-w-md mx-auto">
        {renderGame()}
      </div>
    </div>
  );
}
