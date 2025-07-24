import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bot, CheckCircle, XCircle, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}

export default function BotSettings() {
  const { toast } = useToast();
  const [webAppUrl, setWebAppUrl] = useState('');

  const { data: botInfo, isLoading, error, refetch } = useQuery<BotInfo>({
    queryKey: ['/api/bot/info'],
    queryFn: () => apiRequest('/api/bot/info'),
    retry: false
  });

  const { data: webAppUrlData } = useQuery<{ url: string }>({
    queryKey: ['/api/bot/webapp-url'],
    queryFn: () => apiRequest('/api/bot/webapp-url')
  });

  useEffect(() => {
    if (webAppUrlData?.url) {
      setWebAppUrl(webAppUrlData.url);
    }
  }, [webAppUrlData]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано!",
      description: `${label} скопирован в буфер обмена`,
    });
  };

  const openBotFather = () => {
    window.open('https://t.me/BotFather', '_blank');
  };

  const testBot = async () => {
    try {
      await refetch();
      toast({
        title: "Тест пройден!",
        description: "Соединение с ботом работает правильно",
      });
    } catch (error) {
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключиться к боту. Проверьте токен.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Настройки бота</h1>
          </div>
          <p className="text-muted-foreground">
            Управление Telegram ботом DuoLove
          </p>
        </div>

        {/* Bot Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Статус бота
              {botInfo ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Подключен
                </Badge>
              ) : error ? (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Ошибка
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Проверка...
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Информация о подключенном Telegram боте
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Проверяем подключение...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-4 space-y-2">
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <p className="text-destructive">Не удалось подключиться к боту</p>
                <p className="text-sm text-muted-foreground">
                  Проверьте правильность токена бота
                </p>
                <Button onClick={testBot} variant="outline" size="sm">
                  Попробовать снова
                </Button>
              </div>
            )}

            {botInfo && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Имя:</span>
                    <p className="text-muted-foreground">{botInfo.first_name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Username:</span>
                    <p className="text-muted-foreground">@{botInfo.username}</p>
                  </div>
                  <div>
                    <span className="font-medium">ID:</span>
                    <p className="text-muted-foreground">{botInfo.id}</p>
                  </div>
                  <div>
                    <span className="font-medium">Статус:</span>
                    <p className="text-muted-foreground">
                      {botInfo.is_bot ? 'Бот' : 'Пользователь'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <span className="font-medium text-sm">Возможности бота:</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={botInfo.can_join_groups ? "default" : "secondary"}>
                      Группы: {botInfo.can_join_groups ? "Да" : "Нет"}
                    </Badge>
                    <Badge variant={botInfo.supports_inline_queries ? "default" : "secondary"}>
                      Inline: {botInfo.supports_inline_queries ? "Да" : "Нет"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={testBot} variant="outline" size="sm" className="flex-1">
                Проверить подключение
              </Button>
              <Button onClick={openBotFather} variant="outline" size="sm" className="flex-1">
                <ExternalLink className="h-4 w-4 mr-1" />
                BotFather
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WebApp Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>WebApp настройки</CardTitle>
            <CardDescription>
              URL для настройки WebApp в BotFather
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {webAppUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">WebApp URL:</span>
                  <Button
                    onClick={() => copyToClipboard(webAppUrl, 'WebApp URL')}
                    variant="ghost"
                    size="sm"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-md text-sm font-mono break-all">
                  {webAppUrl}
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Как настроить WebApp:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Перейдите к @BotFather в Telegram</li>
                <li>Выберите команду /mybots</li>
                <li>Выберите вашего бота</li>
                <li>Нажмите "Bot Settings" → "Menu Button" → "Configure Menu Button"</li>
                <li>Вставьте WebApp URL сверху</li>
                <li>Установите текст кнопки: "🎮 Играть"</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>
              Полезные команды для управления ботом
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={() => window.open(`https://t.me/${botInfo?.username || 'duolove_bot'}`, '_blank')}
                variant="outline" 
                className="justify-start"
                disabled={!botInfo}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Открыть бота в Telegram
              </Button>
              
              <Button
                onClick={() => copyToClipboard(`https://t.me/${botInfo?.username || 'duolove_bot'}`, 'Ссылка на бота')}
                variant="outline" 
                className="justify-start"
                disabled={!botInfo}
              >
                <Copy className="h-4 w-4 mr-2" />
                Скопировать ссылку на бота
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}