import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Copy, Share, CheckCircle } from "lucide-react";
import { telegramService } from "@/lib/telegram";
import { database } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";

export default function AddPartner() {
  const [, setLocation] = useLocation();
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkStartParam();
    generateInviteLink();
  }, []);

  const checkStartParam = async () => {
    const startParam = telegramService.startParam;
    
    if (startParam && startParam.startsWith('invite_')) {
      const inviterTelegramId = startParam.replace('invite_', '');
      await handlePartnerInvitation(inviterTelegramId);
    }
  };

  const handlePartnerInvitation = async (inviterTelegramId: string) => {
    try {
      const tgUser = telegramService.user;
      if (!tgUser) {
        toast({
          title: "Ошибка",
          description: "Не удалось получить данные пользователя Telegram",
          variant: "destructive"
        });
        return;
      }

      // Get or create current user
      let dbUser = await database.getUser(tgUser.id.toString());
      if (!dbUser) {
        dbUser = await database.createUser(
          tgUser.id.toString(),
          `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
          tgUser.photo_url
        );
      }

      // Get inviter user data (in real app, this would come from bot API)
      const inviterUser = await database.getUser(inviterTelegramId);
      if (!inviterUser) {
        toast({
          title: "Ошибка",
          description: "Пользователь, который вас пригласил, не найден",
          variant: "destructive"
        });
        return;
      }

      // Add partner connection
      await database.addPartner(
        dbUser.id,
        inviterTelegramId,
        inviterUser.name,
        inviterUser.avatar
      );

      // Also add reverse connection for the inviter
      await database.addPartner(
        inviterUser.id,
        tgUser.id.toString(),
        dbUser.name,
        dbUser.avatar
      );

      telegramService.hapticFeedback('notification', 'success');
      toast({
        title: "Успешно!",
        description: "Партнёр добавлен. Теперь вы можете играть вместе!",
      });

      setLocation('/');
    } catch (error) {
      console.error('Failed to handle partner invitation:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить партнёра",
        variant: "destructive"
      });
    }
  };

  const generateInviteLink = () => {
    const tgUser = telegramService.user;
    if (!tgUser) return;

    const link = telegramService.generateInviteLink(tgUser.id.toString());
    setInviteLink(link);
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

  const shareInviteLink = async () => {
    try {
      await telegramService.shareInviteLink(inviteLink);
      telegramService.hapticFeedback('selection');
    } catch (error) {
      console.error('Failed to share link:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить ссылку",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-md mx-auto">
        {/* Illustration */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Добавьте партнёра
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Отправьте приглашение своему партнёру, чтобы начать играть вместе в мини-игры и отслеживать общий прогресс.
          </p>
        </div>

        {/* Invitation Link Generation */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Ваша ссылка-приглашение
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 break-all font-mono">
                {inviteLink || "Генерация ссылки..."}
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={copyInviteLink}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white"
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
                    Копировать ссылку
                  </>
                )}
              </Button>
              
              <Button 
                onClick={shareInviteLink}
                variant="secondary"
                className="w-full"
                disabled={!inviteLink}
              >
                <Share className="w-4 h-4 mr-2" />
                Отправить в Telegram
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Как это работает?
            </h4>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>1. Скопируйте ссылку-приглашение</li>
              <li>2. Отправьте её своему партнёру</li>
              <li>3. Партнёр переходит по ссылке</li>
              <li>4. Начинайте играть вместе!</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
