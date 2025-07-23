import { useState } from 'react';
import { telegramService } from '@/lib/telegram';
import { database } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function TestInvite() {
  const [inviteId, setInviteId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const testInviteProcessing = async () => {
    if (!inviteId.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ID пользователя для приглашения",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate invite processing
      const currentUser = telegramService.user;
      if (!currentUser) {
        throw new Error('No user data available');
      }

      await database.initialize();

      // Create/get current user in database
      let dbUser = await database.getUser(currentUser.id.toString());
      if (!dbUser) {
        dbUser = await database.createUser(
          currentUser.id.toString(),
          `${currentUser.first_name} ${currentUser.last_name || ''}`.trim(),
          currentUser.photo_url || null
        );
      }

      // Check if partner already exists
      const existingPartner = await database.getPartner(dbUser.id);
      if (existingPartner) {
        toast({
          title: "Уведомление",
          description: "У вас уже есть партнёр",
          variant: "default"
        });
        return;
      }

      // Add partner
      await database.addPartner(
        dbUser.id,
        inviteId,
        `Пользователь ${inviteId}`,
        null
      );

      toast({
        title: "Успешно!",
        description: `Партнёр ${inviteId} добавлен`,
      });

      telegramService.hapticFeedback('notification', 'success');

    } catch (error) {
      console.error('Error processing test invite:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : 'Не удалось обработать приглашение',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getCurrentInfo = () => {
    const user = telegramService.user;
    const startParam = telegramService.startParam;
    
    return {
      userId: user?.id,
      userName: user?.first_name,
      startParam,
      isDevelopment: telegramService.isDevelopment,
      urlParams: window.location.search
    };
  };

  const info = getCurrentInfo();

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Тест системы приглашений</CardTitle>
          <CardDescription>
            Используйте эту страницу для тестирования логики обработки приглашений
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Текущая информация:</h3>
            <div className="text-sm space-y-1 bg-gray-100 dark:bg-gray-800 p-3 rounded">
              <div>User ID: {info.userId || 'N/A'}</div>
              <div>User Name: {info.userName || 'N/A'}</div>
              <div>Start Param: {info.startParam || 'Нет'}</div>
              <div>Development Mode: {info.isDevelopment ? 'Да' : 'Нет'}</div>
              <div>URL Params: {info.urlParams || 'Нет'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Тестирование приглашения:</h3>
            <div className="flex gap-2">
              <Input
                placeholder="ID пользователя для приглашения"
                value={inviteId}
                onChange={(e) => setInviteId(e.target.value)}
                disabled={isProcessing}
              />
              <Button 
                onClick={testInviteProcessing} 
                disabled={isProcessing}
              >
                {isProcessing ? 'Обработка...' : 'Тест'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Тестовые ссылки:</h3>
            <div className="text-sm space-y-1">
              <div>
                <a 
                  href="?invite=invite_12345"
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  Тест с параметром invite_12345
                </a>
              </div>
              <div>
                <a 
                  href="?tgWebAppStartParam=invite_67890"
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  Тест с tgWebAppStartParam=invite_67890
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}