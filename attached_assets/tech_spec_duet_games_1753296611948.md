# 🧩 Техническое задание: Telegram WebApp "DuoLove"

## 📌 Общее описание

**Цель проекта** — разработать мини-приложение в Telegram, в котором два человека (партнёры) могут добавиться друг к другу и вместе играть в мини-игры, выполнять задания, проходить квесты и отслеживать общий прогресс.

**Целевая аудитория** — пары (любовные, дружеские, семейные), которые хотят сблизиться или весело провести время вместе онлайн.

## ⚙️ Технологии

| Компонент                | Технология            |
|-------------------------|------------------------|
| Фронтенд                | React + TypeScript     |
| Бандлер                 | Vite                   |
| Telegram WebApp API     | telegram-web-app SDK   |
| Бэкенд (если нужно позже)| Express (но сейчас — без сервера) |
| База данных             | SQLite (через sql.js или better-sqlite3) |
| Хранение данных         | IndexedDB / LocalStorage |
| Синхронизация с партнёром | Через Telegram bot + ссылку |

## 🧱 Структура проекта

```
/duet-games-app
├── public/
│   └── index.html
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── AddPartner.tsx
│   │   ├── GameList.tsx
│   │   ├── GameRoom.tsx
│   │   ├── History.tsx
│   ├── db/
│   │   └── initDB.ts
│   ├── types/
│   │   └── models.ts
│   ├── utils/
│   │   └── telegram.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```

## 🧩 Основные страницы и логика

### 1. 🏠 Главная (`/`)
- Если партнёр не добавлен → переадресация на `/add-partner`
- Если партнёр есть → отображается:
  - Профиль пользователя и партнёра
  - Кнопка "Начать игру"
  - Последние активности (история)

### 2. 👥 Добавление партнёра (`/add-partner`)
- Сгенерировать ссылку вида `https://t.me/yourbot?start=invite_{partner_id}`
- Сохранить партнёра в локальную БД при нажатии по ссылке
- После добавления → перейти на `/`

### 3. 🎮 Список игр (`/games`)
- Игры разбиты по категориям: узнавание, реакция, квесты, задания
- Кнопка "Пригласить партнёра в игру"
- После нажатия отправляется сообщение в Telegram через бота

### 4. 🧠 Игровая сессия (`/game/:id`)
- Синхронная сессия (через Telegram Bot API и local polling)
- Отображение прогресса обоих игроков
- Интерфейс игры: вопрос/задание → ответ/реакция → результат

### 5. 🕘 История (`/history`)
- История завершённых игр (локально)
- Количество "сердечек", достижений, трофеев

## 🧩 Примеры игр

| Название | Описание |
|----------|----------|
| Кто кого лучше знает | 5 вопросов о партнёре, оба отвечают и сравнивают |
| Синхронный тест на реакцию | Жми кнопку быстрее |
| Парный квест | Пошаговый сюжет с выбором |
| Задание-дня | Весёлое действие или челлендж |
| Правда или действие | Адаптированная онлайн-версия |

## 🧬 Структура данных (SQLite)

### Таблица `user`
```sql
CREATE TABLE user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT,
  name TEXT,
  avatar TEXT
);
```

### Таблица `partner`
```sql
CREATE TABLE partner (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  partner_telegram_id TEXT,
  partner_name TEXT,
  partner_avatar TEXT
);
```

### Таблица `game_sessions`
```sql
CREATE TABLE game_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_type TEXT,
  user_score INTEGER,
  partner_score INTEGER,
  started_at TEXT,
  finished_at TEXT
);
```

### Таблица `actions`
```sql
CREATE TABLE actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  player TEXT,
  action TEXT,
  timestamp TEXT
);
```

## 📡 Взаимодействие с Telegram Bot

> Бот нужен только для:
- Отправки приглашения в игру
- Рассылки напоминаний/уведомлений
- Передачи Telegram ID партнёра при старте по ссылке (`start=invite_12345`)

## ⚠️ Особенности и ограничения

- Все данные хранятся только локально
- Сессии между игроками — через Telegram ID + local state
- Онлайн синхронизация — через бот и временное сообщение-приглашение
- Без полноценного сервера, данные "раздельные", но взаимодействие осуществляется через соглашения

## 🏆 Возможные улучшения в будущем

- Добавить Firebase/WebRTC для настоящей онлайн-синхронизации
- Сделать локальное шифрование SQLite (через SQLCipher)
- Добавить "магазин эмоций": новые фоны, аватарки и т.п. за достижения