# ЛОФА - Структура проекта

## Общая структура

```
lofa/
├── cmd/
│   └── server/
│       └── main.go              # Точка входа Go сервера
├── internal/
│   ├── api/
│   │   ├── handlers.go          # HTTP обработчики (REST API)
│   │   └── handlers_test.go     # Тесты API
│   ├── db/
│   │   ├── db.go                # SQLite база данных
│   │   └── db_test.go           # Тесты БД
│   ├── levels/
│   │   ├── levels.go            # Шаблоны уровней
│   │   └── levels_test.go       # Тесты уровней
│   ├── types/
│   │   └── types.go             # Типы данных
│   ├── ws/
│   │   ├── hub.go               # WebSocket хаб
│   │   └── hub_test.go         # Тесты WebSocket
│   └── api/
├── static/
│   ├── index.html               # Главная страница
│   ├── manifest.json            # PWA манифест
│   ├── favicon.ico              # Иконка
│   ├── styles/
│   │   ├── main.css             # Базовые стили, переменные (:root), reset
│   │   ├── components.css       # Кнопки (primary-btn, secondary-btn, run-btn и т.д.)
│   │   ├── levels.css          # Уровни, карточки, chapter-элементы, tabs
│   │   ├── modal.css           # Модальные окна, popups
│   │   ├── game.css           # Игровое поле, grid, ячейки, панель команд
│   │   ├── forms.css          # Формы (profile-form, gender-select, character-select)
│   │   └── colors/
│   │       ├── boy.css        # Цветовая схема мальчика
│   │       └── girl.css      # Цветовая схема девочки
│   ├── scripts/
│   │   ├── theme.js             # Темизация (мальчик/девочка)
│   │   ├── themeManager.js      # Управление темами
│   │   ├── localization.js      # Локализация (5 языков)
│   │   ├── auth.js             # Авторизация
│   │   ├── levelsManager.js    # Управление уровнями
│   │   ├── achievementsManager.js # Система достижений
│   │   ├── gameLogic.js        # Логика прохождения
│   │   ├── gameManager.js      # Менеджер игры
│   │   ├── leaderboardManager.js # Таблица лидеров
│   │   └── soundsManager.js    # Звуки (заготовка)
│   └── assets/
│       ├── localization/        # Файлы локализации
│       │   ├── ru.json         # Русский
│       │   ├── en.json         # English
│       │   ├── es.json         # Español
│       │   ├── tg.json         # Тоҷикӣ
│       │   ├── uz.json         # O'zbekcha
│       │   └── scenarios/
│       │       └── chapter_1/   # Сценарии главы 1
│       │           ├── chapter_1_ru.json
│       │           ├── chapter_1_en.json
│       │           ├── chapter_1_es.json
│       │           ├── chapter_1_tg.json
│       │           └── chapter_1_uz.json
│       └── flags/              # Флаги стран (PNG)
├── frontend/
│   └── src/
│       └── levels/              # Изображения уровней
├── tests/
│   ├── run_tests.bat           # Запуск тестов
│   ├── api_coverage.out        # Покрытие API
│   ├── db_coverage.out         # Покрытие БД
│   └── ws_coverage.out         # Покрытие WebSocket
├── docs/
│   ├── GAMEDESIGN.md           # Game Design Document
│   ├── STRUCTURE.md            # Этот файл
│   ├── CHANGELOG.md            # История обновлений
│   └── CHAPTER1_ASSETS.md     # Активы первой главы
├── go.mod
├── go.sum
├── SPEC.md                      # Спецификация
├── start.bat                   # Запуск сервера
└── codequest.db                # SQLite база данных
```

## База данных (SQLite)

```sql
-- Пользователи
users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  phone       VARCHAR(20) UNIQUE NOT NULL,
  nickname    VARCHAR(50) NOT NULL,
  name        VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  gender      VARCHAR(10) NOT NULL,  -- 'boy', 'girl'
  performer   VARCHAR(20),           -- 'builder', 'cook'
  age         INTEGER,
  language    VARCHAR(10),           -- 'ru', 'en', 'es', 'tg', 'uz'
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Прогресс игрока
progress (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id),
  level_id    INTEGER NOT NULL,
  stars       INTEGER DEFAULT 0,     -- 0-3
  moves       INTEGER DEFAULT 0,
  code        TEXT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, level_id)
)

-- Достижения
achievements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id),
  achievement_type VARCHAR(50) NOT NULL,
  earned_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Таблица лидеров
leaderboard (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id),
  total_score INTEGER DEFAULT 0,
  username    VARCHAR(50),
  gender      VARCHAR(10),
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## API Endpoints

### Авторизация
```
POST /api/auth/register
  Body: { "phone", "nickname", "name", "password", "gender", "performer", "age", "language" }
  Response: { "token", "user": { "id", "phone", "nickname", "gender", "performer", "age", "token" } }

POST /api/auth/login
  Body: { "phone", "password" }
  Response: { "token", "user": { "id", "phone", "nickname", "gender", "performer", "age", "token" } }

GET /api/auth/me
  Headers: Authorization: Bearer <token>
  Response: { "id", "phone", "nickname", "name", "gender", "performer", "age" }

POST /api/auth/profile
  Headers: Authorization: Bearer <token>
  Body: { "nickname", "name", "age", "gender", "performer" }
  Response: { "success": "Профиль обновлен" }
```

### Игра
```
GET /api/levels
  Response: { "levels": [{ "id", "name", "grid", "player", "goal", "items", "par", "difficulty", "availableCommands", "description" }] }

GET /api/levels/:id
  Response: { 
    "id", "name", "description", "grid": [[...]],
    "player": { "x", "y", "direction" },
    "items": [{ "x", "y", "type" }],
    "goal": "string",
    "availableCommands": ["up", "down", ...],
    "par": 5,
    "difficulty": 1-3
  }

POST /api/levels/:id/complete
  Headers: Authorization: Bearer <token>
  Body: { "code": "up\nright\ndown", "moves": 3 }
  Response: { "success": true, "stars": 3, "moves": 3, "score": 300 }

GET /api/progress
  Headers: Authorization: Bearer <token>
  Response: { "progress": [{ "level_id", "stars", "moves" }] }
```

### Социальные функции
```
GET /api/leaderboard
  Query: ?gender=all|boy|girl
  Response: { "leaderboard": [{ "rank", "userId", "username", "score", "gender" }] }

GET /api/achievements
  Headers: Authorization: Bearer <token>
  Response: { "achievements": [{ "type", "earnedAt" }] }

POST /api/achievements
  Headers: Authorization: Bearer <token>
  Body: { "level_id": 1, "achievement_type": "level_completed" }
  Response: { "success": true }

WS /ws?token=<jwt_token>
  -- Realtime обновления (score updates, achievements)
```

## Модули JavaScript

### theme.js + themeManager.js
- Управление темами оформления
- Тема для мальчика (синие тона): primary #1E4D6B
- Тема для девочки (розовые тона): primary #D4A5B5
- Персонажи: builder (🔨), cook (🍳)
- Предметы: crystal (💎), heart (💖), flag (🚩)
- Динамическая загрузка CSS файлов цветовых схем
- themeManager.apply(gender) - применение темы

### CSS Модульная структура
```
styles/
├── main.css          - Базовые стили, переменные (:root), reset
├── components.css   - Все кнопки: primary-btn, secondary-btn, back-btn,
│                    settings-btn, logout-btn, hint-btn, run-btn, reset-btn
├── levels.css      - Уровни: .levels-grid, .level-card, .chapter-*,
│                    tabs, .level-btn
├── modal.css        - Модальные окна: .modal, .modal-content, .level-info-*,
│                    .level-task-box
├── game.css        - Игра: .game-header, .game-grid, .grid-cell,
│                    .player-*, .code-panel, .commands-*
├── forms.css       - Формы: .profile-form, .character-select, .gender-*,
│                    .form-message
└── colors/
    ├── boy.css    - CSS переменные для мальчика
    └── girl.css   - CSS переменные для девочки
```

### localization.js
- Система локализации (5 языков)
- Ключи для всех UI элементов
- Поддержка gender-specific текстов
- Функция t() для получения перевода

### auth.js
- Регистрация и вход
- Работа с JWT токеном
- Сохранение в localStorage
- Проверка авторизации

### levelsManager.js
- Управление доступом к уровням
- Проверка: уровень открыт/закрыт
- Главы (2 главы по 10 уровней)
- Прогресс по главам

### achievementsManager.js
- Система достижений
- Достижения: first_login, first_level, level_5, chapter_1_complete, all_levels, perfect_level

### gameLogic.js
- Выполнение команд игрока
- Проверка валидности ходов
- Проверка условий победы
- Подсчет звезд и очков

### gameManager.js
- Управление игровым процессом
- Drag & Drop интерфейс
- Анимация перемещения
- Результаты уровня

### leaderboardManager.js
- Загрузка таблицы лидеров
- Фильтрация по полу
- Форматирование данных

## Сетка уровня (grid)

```
0 = пусто
1 = стена
2 = старт (начальная позиция игрока)
3 = финиш (цель/флаг)
4 = предмет (кристалл/сердечко)
```

## Команды

```
up    - движение вверх
down  - движение вниз
left  - движение влево
right - движение вправо
jump  - прыжок через 1-2 клетки
turn  - разворот на 180°
```

## Структура UI

```
┌─────────────────────────────────────────┐
│  Header: [←] Уровень 1 [☆☆☆] [💡]      │
├─────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────┐  │
│  │                 │  │  Команды     │  │
│  │   Game Grid     │  │  [⬆️][⬇️]   │  │
│  │   (сетка)       │  │  [⬅️][➡️]   │  │
│  │                 │  │  [🦘][🔄]   │  │
│  └─────────────────┘  └──────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  [▶ Пуск]  [↺]                    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Локализация

### Файлы локализации
- `static/assets/localization/ru.json` - Русский
- `static/assets/localization/en.json` - English
- `static/assets/localization/es.json` - Español
- `static/assets/localization/tg.json` - Тоҷикӣ
- `static/assets/localization/uz.json` - O'zbekcha

### Сценарии (scenarios)
- `static/assets/localization/scenarios/chapter_1/chapter_1_*.json`
- Gender-specific сценарии для мальчиков и девочек

### Ключи локализации
Основные категории:
- `ui.*` - элементы интерфейса
- `commands.*` - названия команд
- `items.*` - названия предметов
- `chapters.*` - описания глав
- `hero`, `game` - общие термины