import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User } from "lucide-react";
import { database } from "@/lib/database";
import { telegramService } from "@/lib/telegram";
import { GameQuestion } from "@/types/models";

interface KnowledgeTestProps {
  sessionId: number;
  onComplete: (userScore: number, partnerScore: number) => void;
}

const sampleQuestions: GameQuestion[] = [
  {
    id: '1',
    text: 'Какой любимый цвет у вашего партнёра?',
    options: ['Красный', 'Синий', 'Зелёный', 'Жёлтый'],
    correctAnswer: 1
  },
  {
    id: '2',
    text: 'Какое любимое время года у вашего партнёра?',
    options: ['Весна', 'Лето', 'Осень', 'Зима'],
    correctAnswer: 0
  },
  {
    id: '3',
    text: 'Что больше всего любит делать ваш партнёр в свободное время?',
    options: ['Читать', 'Смотреть фильмы', 'Гулять', 'Играть в игры'],
    correctAnswer: 2
  },
  {
    id: '4',
    text: 'Какая любимая кухня у вашего партнёра?',
    options: ['Итальянская', 'Японская', 'Русская', 'Французская'],
    correctAnswer: 1
  },
  {
    id: '5',
    text: 'О чём больше всего мечтает ваш партнёр?',
    options: ['Путешествовать', 'Учиться новому', 'Заниматься спортом', 'Проводить время с семьёй'],
    correctAnswer: 0
  }
];

export default function KnowledgeTest({ sessionId, onComplete }: KnowledgeTestProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [partnerStatus, setPartnerStatus] = useState<'waiting' | 'answering' | 'completed'>('waiting');
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<{ userScore: number; partnerScore: number } | null>(null);

  const currentQuestion = sampleQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / sampleQuestions.length) * 100;

  useEffect(() => {
    // Simulate partner answering
    const timer = setTimeout(() => {
      setPartnerStatus('answering');
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);

  const handleAnswerSelect = async (answerIndex: number) => {
    try {
      telegramService.hapticFeedback('selection');
      
      const newAnswers = [...userAnswers, answerIndex];
      setUserAnswers(newAnswers);

      // Record user action
      await database.addGameAction(
        sessionId,
        'user',
        'answer',
        { questionId: currentQuestion.id, answer: answerIndex }
      );

      // Simulate partner completing the question
      setTimeout(() => {
        setPartnerStatus('completed');
        
        if (currentQuestionIndex < sampleQuestions.length - 1) {
          // Move to next question
          setTimeout(() => {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setPartnerStatus('waiting');
          }, 1500);
        } else {
          // Game complete
          setTimeout(() => {
            completeGame(newAnswers);
          }, 1500);
        }
      }, 2000);

    } catch (error) {
      console.error('Failed to record answer:', error);
    }
  };

  const completeGame = (answers: number[]) => {
    // Calculate scores
    const userScore = answers.reduce((score, answer, index) => {
      return score + (answer === sampleQuestions[index].correctAnswer ? 1 : 0);
    }, 0);
    
    // Simulate partner score
    const partnerScore = Math.floor(Math.random() * 5) + 1;

    setResults({ userScore, partnerScore });
    setIsComplete(true);
    
    telegramService.hapticFeedback('notification', userScore > partnerScore ? 'success' : 'warning');
    onComplete(userScore, partnerScore);
  };

  if (isComplete && results) {
    return (
      <div className="p-4">
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Игра завершена!
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${results.userScore > results.partnerScore ? 'text-green-500' : 'text-gray-500'}`}>
                  {results.userScore}/5
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Ваш результат</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${results.partnerScore > results.userScore ? 'text-green-500' : 'text-gray-500'}`}>
                  {results.partnerScore}/5
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Партнёр</div>
              </div>
            </div>
            
            <div className="mb-6">
              {results.userScore > results.partnerScore ? (
                <p className="text-green-600 dark:text-green-400 font-semibold">
                  🎉 Поздравляем! Вы лучше знаете партнёра!
                </p>
              ) : results.userScore < results.partnerScore ? (
                <p className="text-blue-600 dark:text-blue-400 font-semibold">
                  👏 Ваш партнёр знает вас лучше!
                </p>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 font-semibold">
                  🤝 Ничья! Вы отлично знаете друг друга!
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
    <div className="p-4">
      {/* Progress */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Вопрос {currentQuestionIndex + 1} из {sampleQuestions.length}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Кто кого лучше знает
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            {currentQuestion.text}
          </h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full p-4 text-left justify-start hover:bg-primary/10 hover:border-primary transition-colors duration-200"
                onClick={() => handleAnswerSelect(index)}
                disabled={userAnswers.length > currentQuestionIndex}
              >
                <span className="font-medium mr-2">
                  {String.fromCharCode(65 + index)})
                </span>
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Partner Status */}
      <Card className="bg-secondary/10 dark:bg-secondary/20 border-secondary/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              {partnerStatus === 'waiting' && (
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  Ожидаем партнёра...
                </p>
              )}
              {partnerStatus === 'answering' && (
                <>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    Партнёр отвечает...
                  </p>
                  <div className="flex space-x-1 mt-1">
                    <div className="w-2 h-2 bg-secondary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </>
              )}
              {partnerStatus === 'completed' && (
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  ✓ Партнёр ответил
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}