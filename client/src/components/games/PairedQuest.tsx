import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { telegramService } from "@/lib/telegram";
import { QuestStep } from "@/types/models";

interface PairedQuestProps {
  sessionId: number;
  onComplete: (userScore: number, partnerScore: number) => void;
}

const questSteps: Record<string, QuestStep> = {
  start: {
    id: 'start',
    text: 'Вы оказались на необитаемом острове вместе с партнёром. Что будете делать в первую очередь?',
    choices: [
      { text: 'Искать пресную воду', nextStepId: 'water' },
      { text: 'Строить укрытие', nextStepId: 'shelter' },
      { text: 'Исследовать остров', nextStepId: 'explore' }
    ]
  },
  water: {
    id: 'water',
    text: 'Вы нашли источник пресной воды! Партнёр предлагает сначала очистить воду. Ваши действия?',
    choices: [
      { text: 'Согласиться и очистить воду', nextStepId: 'cooperation' },
      { text: 'Пить сразу, очень хочется', nextStepId: 'impatience' },
      { text: 'Проверить воду на вкус и запах', nextStepId: 'caution' }
    ]
  },
  shelter: {
    id: 'shelter',
    text: 'Вы начали строить укрытие. Партнёр собирает ветки, а что будете делать вы?',
    choices: [
      { text: 'Искать листья для крыши', nextStepId: 'teamwork' },
      { text: 'Помогать с ветками', nextStepId: 'cooperation' },
      { text: 'Разжигать костёр', nextStepId: 'initiative' }
    ]
  },
  explore: {
    id: 'explore',
    text: 'Исследуя остров, вы нашли пещеру. Партнёр боится туда идти. Что предложите?',
    choices: [
      { text: 'Идти вместе, взявшись за руки', nextStepId: 'support' },
      { text: 'Пойти первым, показать пример', nextStepId: 'leadership' },
      { text: 'Найти другое место', nextStepId: 'compromise' }
    ]
  },
  cooperation: {
    id: 'cooperation',
    text: 'Благодаря сотрудничеству вы отлично справились! Партнёр очень рад. Что дальше?',
    choices: [
      { text: 'Отпраздновать успех вместе', nextStepId: 'celebration' },
      { text: 'Планировать следующие действия', nextStepId: 'planning' },
      { text: 'Отдохнуть и насладиться моментом', nextStepId: 'relaxation' }
    ]
  },
  celebration: {
    id: 'celebration',
    text: 'Поздравляем! Вы отлично работаете в команде и умеете радоваться успехам вместе. Ваша связь стала ещё крепче!',
    choices: []
  },
  planning: {
    id: 'planning',
    text: 'Отлично! Вы практичная пара, которая всегда думает наперёд. Благодаря планированию вы точно выживете на острове!',
    choices: []
  },
  // Add other endings...
  teamwork: {
    id: 'teamwork',
    text: 'Прекрасная командная работа! Вы дополняете друг друга и вместе можете справиться с любыми трудностями.',
    choices: []
  },
  support: {
    id: 'support',
    text: 'Ваша взаимная поддержка впечатляет! Вместе вы не боитесь никаких испытаний.',
    choices: []
  },
  leadership: {
    id: 'leadership',
    text: 'Отличные лидерские качества! Вы умеете вести за собой и поддерживать партнёра в трудную минуту.',
    choices: []
  },
  compromise: {
    id: 'compromise',
    text: 'Мудрый компромисс! Вы уважаете чувства друг друга и находите решения, устраивающие обоих.',
    choices: []
  },
  relaxation: {
    id: 'relaxation',
    text: 'Вы умеете наслаждаться моментом и ценить время, проведённое вместе. Это очень важно!',
    choices: []
  },
  impatience: {
    id: 'impatience',
    text: 'Иногда нетерпение может подвести, но партнёр готов поддержать вас в любой ситуации!',
    choices: []
  },
  caution: {
    id: 'caution',
    text: 'Осторожность – отличное качество! Вы заботитесь о безопасности и принимаете взвешенные решения.',
    choices: []
  },
  initiative: {
    id: 'initiative',
    text: 'Замечательная инициатива! Вы умеете брать на себя ответственность и действовать.',
    choices: []
  }
};

export default function PairedQuest({ sessionId, onComplete }: PairedQuestProps) {
  const [currentStepId, setCurrentStepId] = useState('start');
  const [questPath, setQuestPath] = useState<string[]>(['start']);
  const [isComplete, setIsComplete] = useState(false);

  const currentStep = questSteps[currentStepId];
  const isEnding = currentStep.choices.length === 0;

  const handleChoice = (nextStepId: string) => {
    telegramService.hapticFeedback('selection');
    
    const newPath = [...questPath, nextStepId];
    setQuestPath(newPath);
    setCurrentStepId(nextStepId);

    const nextStep = questSteps[nextStepId];
    if (nextStep.choices.length === 0) {
      // Quest ended
      setTimeout(() => {
        completeQuest(newPath);
      }, 3000);
    }
  };

  const completeQuest = (path: string[]) => {
    // Calculate scores based on quest path
    const userScore = path.length * 2; // Simple scoring
    const partnerScore = path.length * 2; // Both get same score for cooperation
    
    setIsComplete(true);
    onComplete(userScore, partnerScore);
  };

  if (isComplete) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Квест завершён!
            </h2>
            
            <div className="mb-6">
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Отличное приключение! Вы прошли увлекательный путь и узнали друг о друге много нового.
              </p>
              <p className="text-accent font-semibold">
                🏆 Получено {questPath.length * 2} сердечек!
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

  return (
    <div className="p-4">
      {/* Quest Progress */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Шаг {questPath.length}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Парный квест
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 leading-relaxed">
            {currentStep.text}
          </h3>
          
          {isEnding ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎉</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Ожидайте результатов...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentStep.choices.map((choice, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full p-4 text-left justify-start hover:bg-accent/10 hover:border-accent transition-colors duration-200 h-auto"
                  onClick={() => handleChoice(choice.nextStepId)}
                >
                  <span className="text-wrap">{choice.text}</span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Path Indicator */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            {questPath.map((_, index) => (
              <div
                key={index}
                className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-secondary"
              />
            ))}
            {!isEnding && (
              <div className="w-3 h-3 rounded-full border-2 border-gray-300 dark:border-gray-600" />
            )}
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
            Прогресс квеста
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
