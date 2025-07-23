import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Users, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { database } from "@/lib/database";
import { telegramService } from "@/lib/telegram";
import { useToast } from "@/hooks/use-toast";

export default function PartnerTest() {
  const [user, setUser] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [inviteUserId, setInviteUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      setLoading(true);
      
      // Get user from Telegram (simulation for development)
      const mockUser = {
        id: Math.floor(Math.random() * 1000000) + 100000,
        first_name: 'Test User',
        last_name: Math.floor(Math.random() * 100).toString(),
        username: `testuser${Math.floor(Math.random() * 1000)}`,
        photo_url: null
      };

      // Check if user exists in database
      let dbUser = await database.getUser(mockUser.id.toString());
      
      if (!dbUser) {
        dbUser = await database.createUser(
          mockUser.id.toString(),
          `${mockUser.first_name} ${mockUser.last_name}`.trim(),
          mockUser.photo_url
        );
      }

      setUser(dbUser);
      await refreshPartner();
    } catch (error) {
      console.error('Failed to initialize user:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPartner = async () => {
    if (!user) return;
    
    try {
      const dbPartner = await database.getPartner(user.id);
      setPartner(dbPartner);
    } catch (error) {
      console.error('Error refreshing partner:', error);
    }
  };

  const simulateInviteAcceptance = async () => {
    if (!inviteUserId || !user) return;
    
    try {
      setInviteLoading(true);
      
      // Simulate accepting an invite from another user
      await database.addPartner(
        user.id,
        inviteUserId,
        `Пользователь ${inviteUserId}`,
        null,
        'connected',
        inviteUserId
      );

      // Simulate notification to inviter
      const response = await fetch('/api/partner/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviterUserId,
          inviteeUserId: user.telegram_id,
          inviteeName: user.name
        })
      });

      if (response.ok) {
        toast({
          title: "Партнёрство установлено!",
          description: "Соединение успешно создано и уведомление отправлено",
        });
      } else {
        toast({
          title: "Предупреждение",
          description: "Партнёр добавлен, но уведомление не отправлено",
          variant: "destructive"
        });
      }

      await refreshPartner();
      setInviteUserId('');
    } catch (error) {
      console.error('Error simulating invite:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось установить партнёрство",
        variant: "destructive"
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const clearPartner = async () => {
    if (!user) return;
    
    try {
      // Simple way to clear partner - reinitialize database
      localStorage.removeItem('duolove_db');
      await database.initialize();
      await initializeUser();
      
      toast({
        title: "Партнёр удалён",
        description: "База данных очищена",
      });
    } catch (error) {
      console.error('Error clearing partner:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Тест Соединения Партнеров</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current User */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Текущий пользователь</h3>
                  {user ? (
                    <div className="space-y-1 text-sm">
                      <p><strong>ID:</strong> {user.telegram_id}</p>
                      <p><strong>Имя:</strong> {user.name}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Загрузка...</p>
                  )}
                </CardContent>
              </Card>

              {/* Partner Status */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 flex items-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <span>Статус партнера</span>
                  </h3>
                  {partner ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 font-medium">Подключён</span>
                      </div>
                      <p><strong>ID:</strong> {partner.partner_telegram_id}</p>
                      <p><strong>Имя:</strong> {partner.partner_name}</p>
                      <p><strong>Статус:</strong> {partner.status}</p>
                      {partner.inviter_user_id && (
                        <p><strong>Пригласил:</strong> {partner.inviter_user_id}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Нет партнера</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Simulate Invite */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Симуляция принятия приглашения</h3>
                <div className="flex space-x-2">
                  <Input
                    placeholder="ID пользователя, который пригласил"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    disabled={inviteLoading}
                  />
                  <Button 
                    onClick={simulateInviteAcceptance}
                    disabled={!inviteUserId || inviteLoading || !!partner}
                    className="whitespace-nowrap"
                  >
                    {inviteLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      'Принять приглашение'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Введите любой ID (например: 123456) для симуляции
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button onClick={refreshPartner} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Обновить статус
              </Button>
              <Button onClick={clearPartner} variant="destructive">
                Очистить партнера
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Инструкции по тестированию</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600 dark:text-gray-400">
              <li>Текущий пользователь создается автоматически</li>
              <li>Введите любой ID пользователя в поле выше</li>
              <li>Нажмите "Принять приглашение" для симуляции соединения</li>
              <li>Проверьте, что партнер появился в статусе</li>
              <li>Откройте главную страницу, чтобы увидеть UI с партнером</li>
              <li>Используйте "Очистить партнера" для сброса</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}