import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useReferralLink } from '@/hooks/use-referral-link';
import { CheckCircle, Copy, Users, TrendingUp, RefreshCw } from 'lucide-react';

export default function ReferralTest() {
  const [testReferralCode, setTestReferralCode] = useState('');
  const [testUserId, setTestUserId] = useState('test_user_123');
  const [testUserName, setTestUserName] = useState('Тестовый пользователь');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const { toast } = useToast();
  
  const { referralLink, referralCode, isLoading, error, copyLink, regenerateCode } = useReferralLink();

  const testReferralConnection = async () => {
    if (!testReferralCode.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите реферальный код для тестирования",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setConnectionResult(null);

    try {
      const response = await fetch('/api/referral/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referralCode: testReferralCode,
          userId: testUserId,
          userName: testUserName
        }),
      });

      const result = await response.json();
      setConnectionResult(result);

      if (response.ok) {
        toast({
          title: "Успех!",
          description: "Реферальная связь установлена",
        });
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось установить связь",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      toast({
        title: "Ошибка",
        description: "Ошибка сети при тестировании",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const getReferralStats = async () => {
    try {
      const response = await fetch(`/api/referral/stats/803210627`);
      const stats = await response.json();
      console.log('Referral stats:', stats);
      toast({
        title: "Статистика получена",
        description: `Всего рефералов: ${stats.totalReferrals}`,
      });
    } catch (error) {
      console.error('Get stats error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось получить статистику",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Тест реферальной системы
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Проверка функциональности новой реферальной системы<br/>
            <span className="text-sm">Теперь генерирует правильные Telegram WebApp ссылки!</span>
          </p>
        </div>

        {/* Ваша реферальная ссылка */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Ваша реферальная ссылка
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Генерация ссылки...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg text-center">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm font-mono break-all">{referralLink}</p>
                </div>
                
                {referralCode && (
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                      <strong>Реферальный код:</strong><br/>
                      <span className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">{referralCode}</span>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-2 text-center">
                      Эта ссылка откроется прямо в Telegram WebApp
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={copyLink} className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Скопировать
                  </Button>
                  <Button onClick={regenerateCode} variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Обновить
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Тест подключения */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Тест подключения по реферальному коду</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="referralCode">Реферальный код для тестирования</Label>
                <Input
                  id="referralCode"
                  value={testReferralCode}
                  onChange={(e) => setTestReferralCode(e.target.value)}
                  placeholder="ref_803210627_xxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Скопируйте код из вашей реферальной ссылки выше
                </p>
              </div>
              <div>
                <Label htmlFor="testUserId">ID тестового пользователя</Label>
                <Input
                  id="testUserId"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  placeholder="test_user_123"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="testUserName">Имя тестового пользователя</Label>
              <Input
                id="testUserName"
                value={testUserName}
                onChange={(e) => setTestUserName(e.target.value)}
                placeholder="Тестовый пользователь"
              />
            </div>

            <Button 
              onClick={testReferralConnection} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Тестируем...
                </>
              ) : (
                'Протестировать подключение'
              )}
            </Button>

            {connectionResult && (
              <div className={`p-4 rounded-lg ${
                connectionResult.success 
                  ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-2">
                  {connectionResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-red-600 dark:bg-red-400 flex-shrink-0 mt-0.5"></div>
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      connectionResult.success 
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {connectionResult.success ? 'Успех!' : 'Ошибка'}
                    </p>
                    <pre className={`text-xs mt-2 ${
                      connectionResult.success 
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {JSON.stringify(connectionResult, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Статистика */}
        <Card>
          <CardHeader>
            <CardTitle>Статистика реферальной системы</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={getReferralStats} variant="outline" className="w-full">
              Получить статистику
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}