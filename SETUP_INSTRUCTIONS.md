# Инструкции для настройки DuoLove Telegram WebApp

## Обязательные изменения при каждом деплое

### 1. Обновление WebApp URL

Когда пользователь предоставляет новый WebApp URL (например, новый домен Replit), нужно обновить его в следующих местах:

#### Файл: `server/telegram-bot.ts`
```typescript
// Строка ~15
this.webAppUrl = process.env.WEBAPP_URL || 
  'НОВЫЙ_URL_ЗДЕСЬ';  // <- Заменить на актуальный URL
```

#### Файл: `replit.md`
```markdown
# Найти строки с старым URL и заменить на новый
- Updated WebApp URL to current Replit instance: `НОВЫЙ_URL_ЗДЕСЬ`
```

### 2. Обновление Telegram Bot Token

Если пользователь предоставляет новый токен бота:

#### Файл: `.env` (создать если не существует)
```
TELEGRAM_BOT_TOKEN=НОВЫЙ_ТОКЕН_ЗДЕСЬ
```

#### Или использовать секреты Replit:
1. Перейти в Secrets в боковой панели Replit
2. Добавить `TELEGRAM_BOT_TOKEN` с новым значением

### 3. Проверка настроек бота в Telegram

После обновления URL убедиться, что в BotFather настроены:

1. **WebApp URL**: Новый URL из пункта 1
2. **Bot Commands**: Обновить если нужно
3. **Inline Mode**: Включить если требуется

### 4. Тестирование после изменений

1. Перейти на `/referral-test` для проверки генерации ссылок
2. Убедиться, что ссылки имеют формат: `https://t.me/BOT_USERNAME/APP_NAME?startapp=REFERRAL_CODE`
3. Протестировать переход по ссылке и подключение партнеров

## Важные файлы для мониторинга

- `server/telegram-bot.ts` - основная логика бота
- `server/routes.ts` - API endpoints для реферальной системы
- `client/src/hooks/use-referral-processing.ts` - обработка реферальных ссылок
- `replit.md` - документация проекта

## Структура реферальных ссылок

Правильный формат: `https://t.me/duolove_bot/DuoLove?startapp=ref_USER_ID_TIMESTAMP`

- `duolove_bot` - имя бота пользователя
- `DuoLove` - название WebApp
- `ref_USER_ID_TIMESTAMP` - реферальный код

## Диагностика проблем

1. **Ссылки не работают**: Проверить WebApp URL в `server/telegram-bot.ts`
2. **Бот не отвечает**: Проверить TELEGRAM_BOT_TOKEN
3. **Реферальные коды не обрабатываются**: Проверить логи в `use-referral-processing.ts`

## Команды для перезапуска

После изменений выполнить:
```bash
npm run dev
```

Или перезапустить workflow "Start application" в Replit.