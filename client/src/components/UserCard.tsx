import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserProfile, PartnerProfile } from "@/types/models";
import { cn } from "@/lib/utils";

interface UserCardProps {
  user: UserProfile | PartnerProfile | null;
  onClick?: () => void;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  relationshipText?: string;
  daysText?: string;
  variant?: 'default' | 'compact' | 'clickable';
  className?: string;
}

export default function UserCard({
  user,
  onClick,
  showOnlineStatus = false,
  isOnline = true,
  relationshipText,
  daysText,
  variant = 'default',
  className
}: UserCardProps) {
  if (!user) return null;

  const isClickable = Boolean(onClick);
  
  const content = (
    <div className={cn(
      "flex items-center space-x-3",
      variant === 'compact' ? 'space-x-2' : 'space-x-3'
    )}>
      <div className="relative">
        <Avatar className={cn(
          variant === 'compact' ? 'w-8 h-8' : 'w-12 h-12'
        )}>
          <AvatarImage src={user.avatar || ""} alt={user.name} />
          <AvatarFallback className={cn(
            variant === 'compact' ? 'text-xs' : 'text-sm',
            "bg-gradient-to-br from-primary/20 to-secondary/20"
          )}>
            {user.name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        
        {showOnlineStatus && (
          <div className={cn(
            "absolute rounded-full border-2 border-white dark:border-gray-800",
            variant === 'compact' ? '-bottom-0.5 -right-0.5 w-3 h-3' : '-bottom-1 -right-1 w-4 h-4',
            isOnline ? 'bg-green-400' : 'bg-gray-400'
          )} />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-semibold text-gray-900 dark:text-white truncate",
          variant === 'compact' ? 'text-sm' : 'text-base'
        )}>
          {user.name}
        </p>
        
        {relationshipText && (
          <p className={cn(
            "text-gray-600 dark:text-gray-400",
            variant === 'compact' ? 'text-xs' : 'text-sm'
          )}>
            {relationshipText}
          </p>
        )}
        
        {daysText && (
          <p className={cn(
            "text-gray-500 dark:text-gray-400",
            variant === 'compact' ? 'text-xs' : 'text-sm'
          )}>
            {daysText}
          </p>
        )}
        
        {showOnlineStatus && (
          <Badge 
            variant={isOnline ? "default" : "secondary"}
            className={cn(
              "mt-1",
              variant === 'compact' ? 'text-xs px-1 py-0' : 'text-xs',
              isOnline 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            {isOnline ? 'Онлайн' : 'Не в сети'}
          </Badge>
        )}
      </div>
    </div>
  );

  if (variant === 'clickable' || isClickable) {
    return (
      <Card 
        className={cn(
          "cursor-pointer hover:shadow-md transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50",
          className
        )}
        onClick={onClick}
      >
        <CardContent className={cn(
          variant === 'compact' ? 'p-3' : 'p-4'
        )}>
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(
      "bg-gray-50 dark:bg-gray-700 rounded-lg",
      variant === 'compact' ? 'p-3' : 'p-4',
      isClickable && "cursor-pointer hover:opacity-80 transition-opacity",
      className
    )} onClick={onClick}>
      {content}
    </div>
  );
}