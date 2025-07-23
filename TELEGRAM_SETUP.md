# Настройка Telegram Bot для DuoLove

## Важная информация для настройки WebApp в BotFather

### Правильный WebApp URL
В настройках бота @duolove_bot в BotFather должен быть указан следующий URL:

```
https://93828f49-b7a4-4135-ba2e-9d9278d7ea0d-00-11q6gmkwtm0pq.riker.replit.dev
```

⚠️ **ВАЖНО**: НЕ добавляйте `/games` или любой другой путь в конце URL!

### URL Исправлен
Обновили систему для использования рабочего Replit dev URL: `https://93828f49-b7a4-4135-ba2e-9d9278d7ea0d-00-11q6gmkwtm0pq.riker.replit.dev`

### Пошаговая настройка в BotFather:

1. Откройте @BotFather в Telegram
2. Выберите команду `/mybots`
3. Выберите бота @duolove_bot
4. Нажмите "Bot Settings"
5. Нажмите "Menu Button"
6. Выберите "Configure Menu Button"
7. Введите URL: `https://workspace-art061.replit.app`

### Проверка настройки:
После настройки пользователи должны иметь возможность:
1. Получить ссылку-приглашение: https://t.me/duolove_bot?start=invite_{user_id}
2. Открыть бота
3. Нажать кнопку "🎮 Открыть DuoLove" 
4. WebApp должен открыться без ошибки "Not Found"

### Текущий статус:
✅ Бот работает и генерирует правильные ссылки-приглашения
✅ API функционирует корректно
✅ WebApp доступен по адресу https://workspace-art061.replit.app
❌ Нужно обновить WebApp URL в настройках BotFather

### Диагностика SPA
Проверка показала, что SPA поддержка работает корректно:
- ✅ Несуществующие маршруты правильно возвращают index.html (status 200)
- ✅ Тестовая страница доступна: https://workspace-art061.replit.app/test
- ✅ API роуты работают корректно: /api/health, /api/invite/generate

### Тестирование:
После исправления URL в BotFather, система должна работать следующим образом:
1. Пользователь 1 генерирует приглашение через бота
2. Пользователь 2 переходит по ссылке
3. Бот показывает кнопку "🎮 Открыть DuoLove"
4. При нажатии открывается WebApp с параметром start_param
5. Приложение автоматически обрабатывает приглашение и создает партнерство

### Для отладки:
Используйте https://workspace-art061.replit.app/test для диагностики Telegram WebApp параметров