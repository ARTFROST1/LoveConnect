import { useLocation } from "wouter";
import { Home, Gamepad2, History, User } from "lucide-react";
import { telegramService } from "@/lib/telegram";

const navItems = [
  { id: 'home', path: '/', icon: Home, label: 'Главная' },
  { id: 'games', path: '/games', icon: Gamepad2, label: 'Игры' },
  { id: 'history', path: '/history', icon: History, label: 'История' },
  { id: 'profile', path: '/profile', icon: User, label: 'Профиль' }
];

export default function Navigation() {
  const [location, setLocation] = useLocation();

  const handleNavigation = (path: string) => {
    telegramService.hapticFeedback('selection');
    setLocation(path);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location === '/';
    }
    return location.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`flex-1 py-3 px-4 text-center transition-colors duration-200 ${
                  active 
                    ? 'text-primary' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <IconComponent className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs block">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
