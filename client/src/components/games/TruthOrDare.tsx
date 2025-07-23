import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Zap } from "lucide-react";
import { telegramService } from "@/lib/telegram";
import { TruthOrDareItem } from "@/types/models";

interface TruthOrDareProps {
  sessionId: number;
  onComplete: (userScore: number, partnerScore: number) => void;
}

const truthQuestions: TruthOrDareItem[] = [
  {
    id: 'truth_1',
    type: 'truth',
    text: 'Какая твоя самая большая мечта, о которой ты никому не рассказывал?',
    difficulty: 'medium'
  },
  {
    id: 'truth_2',
    type: 'truth',
    text: 'О чём ты думаешь перед сном?',
    difficulty: 'easy'
  },
  {
    id: 'truth_3',
    type: 'truth',
    text: 'Если бы ты мог изменить что-то в нашей паре, что бы это было?',
    difficulty: 'hard'
  },
  {
    id: 'truth_4',
    type: 'truth',
    text: 'Какой момент с нами тебе запомнился больше всего?',
    difficulty: 'easy'
  },
  {
    id: 'truth_5',
    type: 'truth',
    text: 'Что тебя больше всего пугает в будущем?',
    difficulty: 'medium'
  }
];

const dareActions: TruthOrDareItem[] = [
  {
    id: 'dare_1',
    type: 'dare',
    text: 'Отправь партнёру голосовое сообщение, где поёшь его любимую песню',
    difficulty: 'medium'
  },
  {
    id: 'dare_2',
    type: 'dare',
    text: 'Сделай селфи с самым забавным лицом и отправь партнёру',
    difficulty: 'easy'
  },
  {
    id: 'dare_3',
    type: 'dare',
    text: 'Напиши партнёру стихотворение из 4 строк о ваших отношениях',
    difficulty: 'hard'
  },
  {
    id: 'dare_4',
    type: 'dare',
    text: 'Запиши видео, где танцуешь под любимую песню партнёра (30 секунд)',
    difficulty: 'medium'
  },
  {
    id: 'dare_5',
    type: 'dare',
    text: 'Отправь партнёру комплимент на иностранном языке',
    difficulty: 'easy'
  }
];

export default function TruthOrDare({ sessionId, onComplete }: TruthOrDareProps) {
  const [gameState, setGameState] = useState<'selection' | 'question' | 'completed'>('selection');
  const [currentItem, setCurrentItem] = useState<TruthOrDareItem | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [isPartnerTurn, setIsPartnerTurn] = useState(false);

  const handleTypeSelection = (type: 'truth' | 'dare') => {
    telegramService.hapticFeedback('selection');
    
    const items = type === 'truth' ? truthQuestions : dareActions;
    const randomItem = items[Math.floor(Math.random() * items.length)];
    
    setCurrentItem(randomItem);
    setGameState('question');
  };

  const handleComplete = () => {
    if (!currentItem) return;

    telegramService.hapticFeedback('notification', 'success');
    
    const newCount = questionsAnswered + 1;
    setQuestionsAnswered(newCount);

    if (newCount >= 3) {
      // Game completed after 3 rounds
      setTimeout(() => {
        setGameState('completed');
        onComplete(newCount * 5, newCount * 5); // Both get same score for participation
      }, 1000);
    } else {
      // Continue with partner's turn or next round
      setIsPartnerTurn(!isPartnerTurn);
      setCurrentItem(null);
      setGameState('selection');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20';
      case 'hard': return 'text-red-500 bg-red-500/20';
      default: return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Легко';
      case 'medium': return 'Средне';
      case 'hard': return 'Сложно';
      default: return 'Нормально';
    }
  };

  if (gameState === 'completed') {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Игра завершена!
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Отлично! Вы ответили на {questionsAnswered} вопросов и выполнили задания. 
              Это помогает узнать друг друга лучше!
            </p>
            
            <div className="bg-purple-500/20 p-4 rounded-xl mb-6">
              <p className="font-semibold text-purple-600 dark:text-purple-400">
                🏆 Получено {questionsAnswered * 5} сердечек каждому!
              </p>
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

  if (gameState === 'question' && currentItem) {
    return (
      <div className="p-4">
        {/* Question Header */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Раунд {questionsAnswered + 1} из 3
                </span>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentItem.difficulty)}`}>
                  {getDifficultyLabel(currentItem.difficulty)}
                </div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isPartnerTurn ? 'Ход партнёра' : 'Ваш ход'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Question/Dare Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                currentItem.type === 'truth' 
                  ? 'bg-blue-500/20 text-blue-600' 
                  : 'bg-purple-500/20 text-purple-600'
              }`}>
                {currentItem.type === 'truth' ? (
                  <MessageCircle className="w-8 h-8" />
                ) : (
                  <Zap className="w-8 h-8" />
                )}
              </div>
              
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                currentItem.type === 'truth'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
              }`}>
                {currentItem.type === 'truth' ? 'Правда' : 'Действие'}
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 text-center leading-relaxed">
              {currentItem.text}
            </h3>
            
            {currentItem.type === 'dare' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl mb-4">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  💡 Совет: После выполнения задания покажите результат партнёру!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Button */}
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {currentItem.type === 'truth' 
                ? 'Ответили на вопрос?' 
                : 'Выполнили задание?'
              }
            </p>
            <Button 
              onClick={handleComplete}
              className={`w-full font-semibold py-3 ${
                currentItem.type === 'truth'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
              }`}
            >
              {currentItem.type === 'truth' ? 'Ответил(а)' : 'Выполнил(а)'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Selection screen
  return (
    <div className="p-4">
      {/* Game Header */}
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-purple-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Правда или действие
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400">
            {isPartnerTurn ? 'Ход партнёра' : 'Ваш ход'} • Раунд {questionsAnswered + 1} из 3
          </p>
        </CardContent>
      </Card>

      {/* Choice Cards */}
      <div className="space-y-4 mb-6">
        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500"
          onClick={() => handleTypeSelection('truth')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Правда</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ответьте на личный вопрос честно
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-purple-500"
          onClick={() => handleTypeSelection('dare')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Действие</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Выполните веселое задание
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-gray-50 dark:bg-gray-800/50">
        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Как играть:
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Выберите "Правда" или "Действие"</li>
            <li>• Выполните задание или ответьте на вопрос</li>
            <li>• Нажмите кнопку подтверждения</li>
            <li>• Передайте ход партнёру</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
