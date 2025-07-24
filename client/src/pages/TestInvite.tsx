import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { telegramService } from '@/lib/telegram';

export default function TestInvite() {
  const [testUrl, setTestUrl] = useState('');

  const handleTestInvite = () => {
    const inviteId = '803210627'; // Тестовый ID (пригласитель из логов)
    const testUrlWithParam = `${window.location.origin}?tgWebAppStartParam=invite_${inviteId}`;
    
    console.log('Test URL generated:', testUrlWithParam);
    window.location.href = testUrlWithParam;
    window.location.reload();
  };

  const handleManualTest = () => {
    if (testUrl) {
      window.location.href = testUrl;
      window.location.reload();
    }
  };

  const currentHash = window.location.hash;
  const currentStartParam = telegramService.startParam;

  return (
    <div className="min-h-screen p-4">
      <Card>
        <CardHeader>
          <CardTitle>Тест пригласительных ссылок</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Текущее состояние:</h3>
            <p>Hash: {currentHash || 'отсутствует'}</p>
            <p>Start Param: {currentStartParam || 'отсутствует'}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Быстрый тест:</h3>
            <Button onClick={handleTestInvite}>
              Протестировать приглашение
            </Button>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Ручной тест:</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Введите URL с #start=invite_..."
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
              />
              <Button onClick={handleManualTest}>
                Перейти
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Пример корректного URL:</h3>
            <code className="text-sm bg-gray-100 p-2 rounded block">
              {window.location.origin}?tgWebAppStartParam=invite_803210627
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Telegram Bot:</h3>
            <p className="text-sm">
              Реальная ссылка: https://t.me/duolove_bot?start=invite_803210627
            </p>
            <p className="text-sm text-gray-600 mt-1">
              (Из логов сервера - этот ID реально используется в тестах)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}