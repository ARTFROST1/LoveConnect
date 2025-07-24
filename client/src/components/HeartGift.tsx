import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Gift } from "lucide-react";
import { database } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";

interface HeartGiftProps {
  userId: number;
  partnerId: number;
  partnerName: string;
  canGiftToday: boolean;
  onHeartGifted: () => void;
}

export default function HeartGift({ 
  userId, 
  partnerId, 
  partnerName, 
  canGiftToday, 
  onHeartGifted 
}: HeartGiftProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isGifting, setIsGifting] = useState(false);
  const { toast } = useToast();

  const handleGiftHeart = async () => {
    if (!canGiftToday) {
      toast({
        title: "Уже подарили сегодня",
        description: "Вы можете подарить только одно сердечко в день",
        variant: "destructive"
      });
      return;
    }

    setIsGifting(true);
    try {
      // Gift heart in database
      await database.giftHeart(userId, partnerId, message.trim() || undefined);
      
      // Add activity log
      await database.addActivity(
        userId, 
        'heart_gifted', 
        `Подарили сердечко ${partnerName}`,
        JSON.stringify({ partnerId, message: message.trim() })
      );

      toast({
        title: "❤️ Сердечко подарено!",
        description: `${partnerName} получит ваше сердечко`
      });

      setIsOpen(false);
      setMessage("");
      onHeartGifted();
    } catch (error) {
      console.error('Failed to gift heart:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось подарить сердечко",
        variant: "destructive"
      });
    } finally {
      setIsGifting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={!canGiftToday}
        className={`relative ${
          canGiftToday 
            ? 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
        } transition-all duration-200`}
      >
        <Gift className="w-4 h-4 mr-2" />
        {canGiftToday ? 'Подарить ❤️' : 'Уже подарили'}
        {canGiftToday && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">
              <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" fill="currentColor" />
              Подарить сердечко {partnerName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-2 animate-bounce">❤️</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Подарите сердечко как знак внимания
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Сообщение (необязательно)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Напишите что-то милое..."
                maxLength={100}
                className="resize-none"
                rows={3}
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {message.length}/100
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
                disabled={isGifting}
              >
                Отмена
              </Button>
              <Button
                onClick={handleGiftHeart}
                disabled={isGifting || !canGiftToday}
                className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
              >
                {isGifting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-1" fill="currentColor" />
                    Подарить
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}