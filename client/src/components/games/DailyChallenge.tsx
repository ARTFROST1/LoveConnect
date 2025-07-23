import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, MessageCircle, Heart } from "lucide-react";
import { telegramService } from "@/lib/telegram";
import { DailyChallengeItem } from "@/types/models";

interface DailyChallengeProps {
  sessionId: number;
  onComplete: (userScore: number, partnerScore: number) => void;
}

const dailyChallenges: DailyChallengeItem[] = [
  {
    id: 'photo_together',
    title: 'Селфи вместе',
    description: 'Сделайте совместное селфи в необычном месте или с забавными лицами',
    type: 'photo'
  },
  {
    id: 'compliment_exchange',
    title: 'Обмен комплиментами',
    description: 'Напишите друг другу по 3 искренних комплимента',
    type: 'text'
  },
  {
    id: 'surprise_action',
    title: 'Мини-сюрприз',
    description: 'Сделайте небольшой приятный сюрприз для партнёра (даже виртуальный)',
    type: 'action'
  },
  {
    id: 'memory_share',
    title: 'Поделитесь воспоминанием',
    description: 'Расскажите партнёру о своём самом ярком воспоминании с ним',
    type: 'text'
  },
  {
    id: 'future_dream',
    title: 'Мечта на двоих',
    description: 'Опишите общую мечту или план, который хотите воплотить вместе',
    type: 'text'
  }
];

export default function DailyChallenge({ sessionId, onComplete }: DailyChallengeProps) {
  const [currentChallenge, setCurrentChallenge] = useState<DailyChallengeItem | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Select daily challenge (in real app, this would be based on date)
    const today = new Date().getDate();
    const challengeIndex = today % dailyChallenges.length;
    setCurrentChallenge(dailyChallenges[challengeIndex]);
  }, []);

  const handleComplete = () => {
    if (!currentChallenge) return;

    telegramService.hapticFeedback('notification', 'success');
    setIsSubmitted(true);

    // Simulate completion
    setTimeout(() => {
      setIsCompleted(true);
      onComplete(10, 10); // Both get same score for participation
    }, 2000);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'photo': return Camera;
      case 'text': return MessageCircle;
      case 'action': return Heart;
      default: return Heart;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'photo': return 'Фото-задание';
      case 'text': return 'Текстовое задание';
      case 'action': return 'Действие';
      default: return 'Задание';
    }
  };

  const getInstructions = (type: string) => {
    switch (type) {
      case 'photo':
        return 'Сделайте фото и поделитесь им с партнёром через Telegram';
      case 'text':
        return 'Напишите ответ и отправьте партнёру в личные сообщения';
      case 'action':
        return 'Выполните действие и расскажите партнёру о результате';
      default:
        return 'Выполните задание и поделитесь результатом с партнёром';
    }
  };

  if (!currentChallenge) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Задание выполнено!
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Отлично! Вы оба выполнили сегодняшнее задание. Это укрепляет ваши отношения!
            </p>
            
            <div className="bg-accent/20 p-4 rounded-xl mb-6">
              <p className="font-semibold text-accent">
                🏆 Получено 10 сердечек каждому!
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-primary to-secondary text-white"
                onClick={() => window.location.href = '/games'}
              >
                Другие игры
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

  const IconComponent = getIcon(currentChallenge.type);

  return (
    <div className="p-4">
      {/* Challenge Header */}
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconComponent className="w-8 h-8 text-green-600" />
          </div>
          
          <div className="inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium mb-3">
            {getTypeLabel(currentChallenge.type)}
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Задание дня
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400">
            Выполните это задание вместе с партнёром
          </p>
        </CardContent>
      </Card>

      {/* Challenge Details */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            {currentChallenge.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            {currentChallenge.description}
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Как выполнить:
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {getInstructions(currentChallenge.type)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Card>
        <CardContent className="p-6">
          {isSubmitted ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Ожидаем подтверждения от партнёра...
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Выполнили задание? Нажмите кнопку ниже
              </p>
              <Button 
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3"
              >
                Задание выполнено
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
