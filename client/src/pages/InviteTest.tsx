import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { telegramService } from '@/lib/telegram';
import { database } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle, Users, Link, Trash2 } from 'lucide-react';

export default function InviteTest() {
  const [inviteLink, setInviteLink] = useState('');
  const [testInviteUrl, setTestInviteUrl] = useState('');
  const [partner, setPartner] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const currentUser = telegramService.user;
  const startParam = telegramService.startParam;

  useEffect(() => {
    loadPartnerData();
    generateInviteLink();
  }, []);

  const loadPartnerData = async () => {
    if (currentUser) {
      const partnerData = await database.getPartner(currentUser.id);
      setPartner(partnerData);
    }
  };

  const generateInviteLink = async () => {
    if (currentUser) {
      try {
        const link = await telegramService.generateInviteLink(currentUser.id.toString());
        setInviteLink(link);
      } catch (error) {
        console.error('Error generating invite link:', error);
      }
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Скопировано!",
        description: "Ссылка-приглашение скопирована в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать ссылку",
        variant: "destructive",
      });
    }
  };

  const simulateInviteAcceptance = () => {
    // Simulate someone else clicking the invite link
    const baseUrl = window.location.origin;
    const inviterId = currentUser?.id;
    const inviteeId = (currentUser?.id || 0) + 1;
    
    const simulatedUrl = `${baseUrl}?start=invite_${inviterId}&testUserId=${inviteeId}`;
    setTestInviteUrl(simulatedUrl);
    
    // Open in new tab to simulate another user
    window.open(simulatedUrl, '_blank');
  };

  const testWithCustomUrl = () => {
    if (testInviteUrl) {
      window.open(testInviteUrl, '_blank');
    }
  };

  const clearPartner = async () => {
    if (currentUser) {
      try {
        await database.removePartner(currentUser.id);
        setPartner(null);
        toast({
          title: "Партнёр удалён",
          description: "Связь с партнёром удалена",
        });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить партнёра",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
          Тест приглашений
        </h1>

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Текущий пользователь
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentUser ? (
              <div className="space-y-2 text-sm">
                <p><strong>ID:</strong> {currentUser.id}</p>
                <p><strong>Имя:</strong> {currentUser.first_name} {currentUser.last_name || ''}</p>
                <p><strong>Username:</strong> {currentUser.username || 'Нет'}</p>
                <p><strong>Режим:</strong> {telegramService.isDevelopment ? 'Разработка' : 'Продакшн'}</p>
                <p><strong>Start Param:</strong> {startParam || 'Нет'}</p>
              </div>
            ) : (
              <p className="text-red-500">Пользователь не найден</p>
            )}
          </CardContent>
        </Card>

        {/* Partner Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Статус партнёра
            </CardTitle>
          </CardHeader>
          <CardContent>
            {partner ? (
              <div className="space-y-2">
                <p className="text-green-600 dark:text-green-400 font-semibold">✅ Партнёр подключён</p>
                <div className="text-sm">
                  <p><strong>ID партнёра:</strong> {partner.partner_telegram_id}</p>
                  <p><strong>Имя:</strong> {partner.partner_name || 'Неизвестно'}</p>
                  <p><strong>Дата подключения:</strong> {new Date(partner.connected_at).toLocaleString()}</p>
                </div>
                <Button 
                  onClick={clearPartner}
                  variant="destructive" 
                  size="sm"
                  className="mt-2"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить партнёра
                </Button>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">❌ Партнёр не подключён</p>
            )}
          </CardContent>
        </Card>

        {/* Invite Link Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Ваша ссылка-приглашение
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-xs font-mono break-all">
                {inviteLink || "Генерация ссылки..."}
              </p>
            </div>
            
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
                onClick={simulateInviteAcceptance}
                variant="outline"
                disabled={!inviteLink}
              >
                Тест приглашения
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Custom Test URL */}
        <Card>
          <CardHeader>
            <CardTitle>Ручной тест</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Введите URL приглашения для теста"
              value={testInviteUrl}
              onChange={(e) => setTestInviteUrl(e.target.value)}
            />
            
            <Button 
              onClick={testWithCustomUrl}
              variant="outline"
              className="w-full"
              disabled={!testInviteUrl}
            >
              Открыть тестовый URL
            </Button>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p><strong>Пример корректного URL:</strong></p>
              <code className="break-all">
                {window.location.origin}?start=invite_803210627&testUserId=803210628
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Отладочная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1 font-mono">
              <p><strong>URL:</strong> {window.location.href}</p>
              <p><strong>Search:</strong> {window.location.search || 'Нет'}</p>
              <p><strong>Hash:</strong> {window.location.hash || 'Нет'}</p>
              <p><strong>Telegram Available:</strong> {window.Telegram?.WebApp ? 'Да' : 'Нет'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}