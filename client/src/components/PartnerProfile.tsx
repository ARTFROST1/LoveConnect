import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, Trophy, Users, AlertTriangle } from "lucide-react";
import { PartnerProfile as PartnerProfileType } from "@/types/models";

interface PartnerProfileProps {
  partner: PartnerProfileType;
  isOpen: boolean;
  onClose: () => void;
  totalGames: number;
  connectionScore: number;
  onDisconnect?: () => void;
}

export default function PartnerProfileModal({ 
  partner, 
  isOpen, 
  onClose, 
  totalGames, 
  connectionScore,
  onDisconnect 
}: PartnerProfileProps) {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getDaysConnected = () => {
    const connectedDate = new Date(partner.connectedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - connectedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getConnectionLevel = () => {
    if (connectionScore >= 100) return { level: "Неразлучники", color: "bg-gradient-to-r from-pink-500 to-red-500" };
    if (connectionScore >= 75) return { level: "Близкие", color: "bg-gradient-to-r from-purple-500 to-pink-500" };
    if (connectionScore >= 50) return { level: "Друзья", color: "bg-gradient-to-r from-blue-500 to-purple-500" };
    if (connectionScore >= 25) return { level: "Знакомые", color: "bg-gradient-to-r from-green-500 to-blue-500" };
    return { level: "Новички", color: "bg-gradient-to-r from-gray-500 to-green-500" };
  };

  const connectionLevel = getConnectionLevel();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[340px] rounded-2xl border-none bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              Профиль партнёра
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Avatar and Name */}
            <div className="text-center">
              <div className="relative mx-auto w-20 h-20 mb-3">
                <div className="w-full h-full bg-secondary rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                  {partner.avatar ? (
                    <img 
                      src={partner.avatar} 
                      alt={partner.name} 
                      className="w-full h-full rounded-full object-cover" 
                    />
                  ) : (
                    <span className="text-white font-bold text-2xl">
                      {partner.name?.charAt(0) || 'P'}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white dark:border-gray-900 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {partner.name || 'Партнёр'}
              </h3>
              <Badge 
                className={`${connectionLevel.color} text-white border-none mt-2`}
              >
                {connectionLevel.level}
              </Badge>
            </div>

            {/* Connection Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {getDaysConnected()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  дней вместе
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Trophy className="w-5 h-5 text-secondary mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {totalGames}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  игр сыграно
                </div>
              </div>
            </div>

            {/* Connection Score */}
            <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Heart className="w-5 h-5 text-primary" fill="currentColor" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Баллы связи
                </span>
              </div>
              <div className="text-3xl font-bold text-primary mb-2">
                {connectionScore}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(connectionScore, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Connection Date */}
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Users className="w-5 h-5 text-accent mx-auto mb-2" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Подключились
              </div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {formatDate(partner.connectedAt)}
              </div>
            </div>

            {/* Disconnect Button */}
            {onDisconnect && (
              <Button 
                variant="outline"
                onClick={() => setShowDisconnectDialog(true)}
                className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Разорвать связь
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent className="w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-red-600">
              Разорвать связь?
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Вы уверены, что хотите разорвать связь с {partner.name || 'партнёром'}? 
              Это действие нельзя отменить.
            </p>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDisconnectDialog(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  onDisconnect?.();
                  setShowDisconnectDialog(false);
                  onClose();
                }}
                className="flex-1"
              >
                Разорвать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}