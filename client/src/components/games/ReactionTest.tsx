import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { database } from "@/lib/database";
import { telegramService } from "@/lib/telegram";
import { ReactionTestResult } from "@/types/models";

interface ReactionTestProps {
  sessionId: number;
  onComplete: (userScore: number, partnerScore: number) => void;
}

type GameState = 'waiting' | 'ready' | 'go' | 'too-early' | 'completed';

export default function ReactionTest({ sessionId, onComplete }: ReactionTestProps) {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [startTime, setStartTime] = useState<number>(0);
  const [result, setResult] = useState<ReactionTestResult>({ userTime: null, partnerTime: null });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (gameState === 'waiting') {
      startGame();
    }
  }, []);

  const startGame = useCallback(() => {
    setGameState('ready');
    
    // Random delay between 1-4 seconds
    const delay = Math.random() * 3000 + 1000;
    
    setTimeout(() => {
      setGameState('go');
      setStartTime(Date.now());
    }, delay);
  }, []);

  const handleClick = async () => {
    try {
      if (gameState === 'ready') {
        // Too early
        setGameState('too-early');
        telegramService.hapticFeedback('notification', 'error');
        
        setTimeout(() => {
          startGame();
        }, 2000);
        return;
      }

      if (gameState === 'go') {
        const reactionTime = Date.now() - startTime;
        const reactionTimeSeconds = reactionTime / 1000;
        
        telegramService.hapticFeedback('notification', 'success');
        
        // Record user reaction
        await database.addGameAction(
          sessionId,
          'user',
          'reaction',
          { time: reactionTimeSeconds }
        );

        // Simulate partner reaction time (slightly random)
        const partnerTime = (Math.random() * 0.4 + 0.2).toFixed(3);
        
        setResult({
          userTime: parseFloat(reactionTimeSeconds.toFixed(3)),
          partnerTime: parseFloat(partnerTime)
        });
        
        setGameState('completed');
        
        // Complete the game after showing results
        setTimeout(() => {
          completeGame(reactionTimeSeconds, parseFloat(partnerTime));
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to handle reaction test:', error);
    }
  };

  const completeGame = (userTime: number, partnerTime: number) => {
    // Score based on reaction time (faster = higher score)
    const userScore = userTime < partnerTime ? 10 : (userTime === partnerTime ? 5 : 0);
    const partnerScore = partnerTime < userTime ? 10 : (partnerTime === userTime ? 5 : 0);
    
    setIsComplete(true);
    onComplete(userScore, partnerScore);
  };

  const getButtonProps = () => {
    switch (gameState) {
      case 'waiting':
      case 'ready':
        return {
          className: "w-48 h-48 bg-red-500 hover:bg-red-600 text-white rounded-full text-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200",
          children: "Ждите..."
        };
      case 'go':
        return {
          className: "w-48 h-48 bg-green-500 hover:bg-green-600 text-white rounded-full text-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200",
          children: "Нажми!"
        };
      case 'too-early':
        return {
          className: "w-48 h-48 bg-red-600 text-white rounded-full text-xl font-bold shadow-lg",
          children: "Рано!",
          disabled: true
        };
      case 'completed':
        return {
          className: "w-48 h-48 bg-blue-500 text-white rounded-full text-xl font-bold shadow-lg",
          children: "Готово!",
          disabled: true
        };
      default:
        return {};
    }
  };

  if (isComplete) {
    const userWon = result.userTime! < result.partnerTime!;
    const isTie = result.userTime === result.partnerTime;
    
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Результаты теста на реакцию
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${userWon ? 'text-green-500' : isTie ? 'text-gray-500' : 'text-gray-400'}`}>
                  {result.userTime?.toFixed(3)}с
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Ваше время</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${!userWon && !isTie ? 'text-green-500' : isTie ? 'text-gray-500' : 'text-gray-400'}`}>
                  {result.partnerTime?.toFixed(3)}с
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Время партнёра</div>
              </div>
            </div>
            
            <div className="mb-6">
              {userWon ? (
                <p className="text-green-600 dark:text-green-400 font-semibold">
                  ⚡ Поздравляем! У вас быстрая реакция!
                </p>
              ) : isTie ? (
                <p className="text-gray-600 dark:text-gray-400 font-semibold">
                  🤝 Ничья! Одинаковая скорость реакции!
                </p>
              ) : (
                <p className="text-blue-600 dark:text-blue-400 font-semibold">
                  🎯 Ваш партнёр оказался быстрее!
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-primary to-secondary text-white"
                onClick={() => window.location.href = '/games'}
              >
                Играть ещё
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/'}
              >
                На главную
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 min-h-screen flex flex-col justify-center">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Тест на реакцию
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Нажмите кнопку, когда она станет зелёной!
        </p>
      </div>

      {/* Reaction Button */}
      <div className="flex-1 flex items-center justify-center mb-8">
        <Button
          {...getButtonProps()}
          onClick={handleClick}
        />
      </div>

      {/* Current Results */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {result.userTime ? `${result.userTime.toFixed(3)}с` : '0.000с'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Ваше время</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-secondary">
                {result.partnerTime ? `${result.partnerTime.toFixed(3)}с` : 'Ждём...'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Время партнёра</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
