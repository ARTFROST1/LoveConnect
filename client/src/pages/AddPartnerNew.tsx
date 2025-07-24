import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Copy, Share, Users, Zap, RefreshCw, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePartnerSync } from '@/hooks/use-partner-sync';
import { useReferralLink } from '@/hooks/use-referral-link';
import { telegramService } from '@/lib/telegram';

export default function AddPartner() {
  const { toast } = useToast();
  const user = telegramService.user;
  const { partner: syncedPartner } = usePartnerSync(user?.id || 0);
  
  // Check if user has partner
  const hasPartner = Boolean(
    syncedPartner && syncedPartner.id && syncedPartner.partner_name && syncedPartner.partner_telegram_id
  );
  const partnerData = hasPartner ? {
    partnerName: syncedPartner?.partner_name
  } : null;
  const { referralLink, referralCode, isLoading, error, copyLink, regenerateCode } = useReferralLink();

  const shareReferralLink = async () => {
    if (!referralLink) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Приглашение в DuoLove',
          text: 'Присоединяйся ко мне в DuoLove - играй в мини-игры вместе!',
          url: referralLink,
        });
        toast({
          title: "Поделились!",
          description: "Приглашение отправлено",
        });
      } else {
        // Fallback - копируем в буфер обмена
        copyLink();
      }
    } catch (error) {
      console.error('Error sharing referral link:', error);
      // Если не удалось поделиться, копируем в буфер обмена
      copyLink();
    }
  };

  if (hasPartner && partnerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Партнёр подключён!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Вы уже подключены к партнёру <strong>{partnerData.partnerName}</strong>. 
              Теперь можете играть в мини-игры вместе!
            </p>
          </div>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Готовы начать играть? Перейдите в раздел игр!
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-primary to-secondary text-white"
                onClick={() => window.location.href = '/games'}
              >
                <Zap className="w-4 h-4 mr-2" />
                Начать играть
              </Button>
            </CardContent>
          </Card>

          {/* Показываем реферальную ссылку даже если партнер уже есть */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Ваша реферальная ссылка
              </h3>
              
              {isLoading ? (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl mb-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Генерация ссылки...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-xl mb-4 text-center">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 break-all font-mono">
                      {referralLink}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button 
                        onClick={copyLink}
                        className="flex-1 bg-gradient-to-r from-primary to-secondary text-white"
                        disabled={!referralLink}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Скопировать
                      </Button>
                      
                      <Button 
                        onClick={shareReferralLink}
                        variant="outline"
                        className="flex-1"
                        disabled={!referralLink}
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Поделиться
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={regenerateCode}
                      variant="outline"
                      className="w-full"
                      disabled={!referralLink}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Обновить код
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Добавьте партнёра
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Поделитесь реферальной ссылкой с партнёром, чтобы начать играть вместе в мини-игры.
          </p>
        </div>

        {/* Referral Link Generation */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Ваша реферальная ссылка
            </h3>
            
            {isLoading ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl mb-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Генерация ссылки...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-xl mb-4 text-center">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <Button 
                  onClick={regenerateCode}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Попробовать снова
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300 break-all font-mono">
                    {referralLink}
                  </p>
                </div>
                
                {referralCode && (
                  <div className="text-center mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Код: <span className="font-mono">{referralCode}</span>
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Button 
                    onClick={copyLink}
                    className="w-full bg-gradient-to-r from-primary to-secondary text-white"
                    disabled={!referralLink}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Скопировать ссылку
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={shareReferralLink}
                      variant="outline"
                      className="flex-1"
                      disabled={!referralLink}
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Поделиться
                    </Button>
                    
                    <Button 
                      onClick={regenerateCode}
                      variant="outline"
                      className="flex-1"
                      disabled={!referralLink}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Обновить
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
              Как работает реферальная система:
            </h3>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-decimal list-inside">
              <li>Скопируйте вашу уникальную реферальную ссылку</li>
              <li>Отправьте её партнёру любым способом</li>
              <li>Партнёр переходит по ссылке и открывает приложение</li>
              <li>Автоматически устанавливается связь между вами</li>
              <li>Теперь можете играть в мини-игры вместе!</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 <strong>Совет:</strong> Ваша реферальная ссылка уникальна и постоянна. 
                Можете использовать её для приглашения разных партнёров.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}