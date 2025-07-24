import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, CheckCircle, Info } from "lucide-react";
import { telegramService } from "@/lib/telegram";
import { useToast } from "@/hooks/use-toast";

export default function StartappTest() {
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [startParam, setStartParam] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check current start parameter
    const currentStartParam = telegramService.startParam;
    setStartParam(currentStartParam);
    
    // Generate invite link for current user
    generateInviteLink();
  }, []);

  const generateInviteLink = async () => {
    const tgUser = telegramService.user;
    if (!tgUser) {
      console.log("No user data available for generating invite link");
      return;
    }

    try {
      const link = await telegramService.generateInviteLink(tgUser.id.toString());
      setInviteLink(link);
    } catch (error) {
      console.error("Failed to generate invite link:", error);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      telegramService.hapticFeedback('notification', 'success');
      toast({
        title: "Скопировано!",
        description: "Ссылка-приглашение скопирована в буфер обмена",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать ссылку",
        variant: "destructive"
      });
    }
  };

  const testInviteLink = () => {
    if (inviteLink) {
      // For Telegram WebApp links, we need to open them in a new window
      // In a real Telegram environment, this would trigger the bot
      window.open(inviteLink, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Тест системы startapp
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Проверка генерации и обработки пригласительных ссылок
          </p>
        </div>

        {/* Current Start Parameter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Текущий параметр запуска
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <code className="text-sm">
                {startParam ? (
                  <span className="text-green-600 dark:text-green-400">
                    startParam: "{startParam}"
                  </span>
                ) : (
                  <span className="text-gray-500">
                    Параметр startapp не найден (обычная загрузка приложения)
                  </span>
                )}
              </code>
            </div>
            {startParam && startParam.startsWith('invite_') && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ Обнаружено приглашение от пользователя: {startParam.replace('invite_', '')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Invite Link */}
        <Card>
          <CardHeader>
            <CardTitle>Ваша ссылка-приглашение</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300 break-all font-mono">
                {inviteLink || "Генерация ссылки..."}
              </p>
            </div>

            {inviteLink && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button 
                    onClick={copyInviteLink}
                    className="flex-1"
                    disabled={!inviteLink}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Скопировано!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Копировать
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={testInviteLink}
                    variant="outline"
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Тестировать
                  </Button>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>• Ссылка в формате https://t.me/duolove_bot/app?startapp=invite_[ID]</p>
                  <p>• Запускает WebApp через Telegram Bot</p>
                  <p>• Автоматически обрабатывает приглашение</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* URL Format Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Анализ формата ссылки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✅ Правильный формат
                  </h4>
                  <code className="text-xs text-green-700 dark:text-green-300 block bg-white dark:bg-gray-800 p-2 rounded break-all">
                    https://t.me/duolove_bot/app?startapp=invite_123456
                  </code>
                  <ul className="text-xs text-green-600 dark:text-green-400 mt-2 space-y-1">
                    <li>• Запускает WebApp через Telegram</li>
                    <li>• Передает startapp параметр</li>
                    <li>• Работает во всех клиентах Telegram</li>
                  </ul>
                </div>

                <div className="p-4 border-2 border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    ❌ Неправильный формат
                  </h4>
                  <code className="text-xs text-red-700 dark:text-red-300 block bg-white dark:bg-gray-800 p-2 rounded break-all">
                    https://[app].replit.dev?startapp=invite_123456
                  </code>
                  <ul className="text-xs text-red-600 dark:text-red-400 mt-2 space-y-1">
                    <li>• Прямая ссылка на домен</li>
                    <li>• Telegram не распознает как WebApp</li>
                    <li>• Параметры startapp теряются</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  📋 Техническая информация
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <p><strong>Telegram WebApp API:</strong> Только ссылки через t.me/[bot]/app корректно передают startapp параметры</p>
                  <p><strong>Обработка параметров:</strong> initDataUnsafe.start_param или URL query параметры</p>
                  <p><strong>Совместимость:</strong> Работает во всех официальных клиентах Telegram</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Development Mode Info */}
        {telegramService.isDevelopment && (
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">
                🧪 Режим разработки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                <p>В режиме разработки используется прямая ссылка для тестирования.</p>
                <p>В продакшене будет генерироваться правильная Telegram WebApp ссылка.</p>
                <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded border">
                  <p className="font-mono text-xs break-all">{inviteLink}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}