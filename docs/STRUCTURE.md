# ЛОФА - Структура проекта

## Общая структура

```
lofa/
├── cmd/
│   └── server/
│       └── main.go              # Точка входа Go сервера
├── internal/
│   ├── api/
│   │   ├── auth.go              # Регистрация, логин, профиль
│   │   ├── handlers.go          # HTTP обработчики (REST API)
│   │   ├── middleware.go        # Логирование, CORS, recovery
│   │   ├── ratelimit.go         # Rate limiter
│   │   ├── handlers_test.go     # Тесты API
│   │   └── middleware_test.go   # Тесты middleware
│   ├── auth/
│   │   └── jwt.go               # Генерация/валидация JWT
│   ├── config/
│   │   └── config.go            # Конфигурация (env, JWT, CORS)
│   ├── db/
│   │   ├── db.go                # SQLite подключение + миграции
│   │   └── db_test.go           # Тесты БД
│   ├── levels/
│   │   ├── levels.go            # Загрузка глав из JSON + кеш
│   │   ├── levels_gen.go        # Генерация уровней (шаблоны → команды)
│   │   ├── chapter_1.json       # Данные 1-й главы (20 уровней)
│   │   └── levels_test.go       # Тесты уровней
│   ├── scoring/
│   │   ├── scoring.go           # Валидация целей + расчёт звёзд
│   │   └── scoring_test.go      # Тесты скоринга
│   ├── types/
│   │   ├── types.go             # Типы данных (User, Level, Goal, ...)
│   │   └── api.go               # Типы запросов/ответов API
│   ├── achievements/
│   │   └── service.go           # Система достижений
│   ├── ws/
│   │   ├── hub.go               # WebSocket хаб + обработка
│   │   └── hub_test.go          # Тесты WebSocket
│   └──
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
│   │   ├── localization.js      # Локализация (6 языков)
│   │   ├── auth.js             # Авторизация + JWT
│   │   ├── levelsManager.js    # Управление уровнями
│   │   ├── achievementsManager.js # Система достижений
│   │   ├── gameLogic.js        # Логика прохождения
│   │   ├── gameEngine.js       # Движок игры (выполнение команд)
│   │   ├── gameManager.js      # Менеджер игры (UI)
│   │   ├── gameRenderer.js     # Рендеринг поля
│   │   ├── leaderboardManager.js # Таблица лидеров
│   │   └── soundsManager.js    # Звуки (заготовка — не удалять)
│   └── assets/
│       ├── localization/        # Файлы локализации
│       │   ├── ru.json         # Русский
│       │   ├── en.json         # English
│       │   ├── es.json         # Español
│       │   ├── tg.json         # Тоҷикӣ
│       │   ├── uz.json         # O'zbekcha
│       │   ├── bxr.json        # Буряад
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
│       ├── levels/              # Изображения уровней (chapter_1, chapter_2)
│       │   └── chapter_1/       # 20 уровней (boy/girl версии)
│       ├── components/         # Компоненты персонажей и UI
│       │   └── Character/       # Персонажи (builder, cook, pilot, robot, etc.)
│       └── assets/components/  # Игровые предметы (flour, apple, flag, и т.д.)
├── tests/
│   ├── run_tests.bat           # Запуск Go-тестов
│   ├── localization_test.js    # Тесты локализации
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

-- Прогресс игрока (раздельный по гендеру)
progress (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id),
  level_id    INTEGER NOT NULL,
  stars       INTEGER DEFAULT 0,     -- 0-3
  moves       INTEGER DEFAULT 0,
  attempts    INTEGER DEFAULT 0,
  code        TEXT,
  gender      VARCHAR(10) DEFAULT '',
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, level_id, gender)
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
  Response: { "success": true, "token": "<new_jwt>" }  -- новый токен при смене гендера
```

### Игра
```
GET /api/levels
  Query: ?gender=boy|girl
  Response: { "levels": [{ "id", "name", "grid", "player", "goal", "goals", "items", "par", "optimal", "difficulty", "availableCommands", "description" }] }

GET /api/levels/:id
  Query: ?gender=boy|girl
  Response: { 
    "id", "name", "description", "grid": [[...]],
    "player": { "x", "y", "direction" },
    "items": [{ "x", "y", "type" }],
    "goal": "string",
    "goals": [{ "type": "reach_finish|collect_all|deliver_to_warehouse", "count": 0 }],
    "availableCommands": ["up", "down", ...],
    "par": 5,
    "optimal": 4,
    "difficulty": 1-3
  }

POST /api/levels/:id/complete
  Headers: Authorization: Bearer <token>
  Body: { "code": "up\nright\ndown", "moves": 3, "playerX": 0, "playerY": 3, "itemsCollected": 0, "itemsOnWarehouse": 0 }
  Response: { "success": true, "stars": 3, "moves": 3, "score": 300 }
  -- Звёзды: 1 за прохождение + 1 если ходы ≤ optimal + 1 если первая попытка

GET /api/progress
  Headers: Authorization: Bearer <token>
  Query: ?gender=boy|girl (опционально, иначе из JWT)
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

WS /ws
  -- Аутентификация первым сообщением (не в URL):
     {"type":"auth","token":"<jwt_token>"}
  -- После валидации — регистрация в хабе
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

## Скоринг (internal/scoring/scoring.go)

### Расчёт звёзд
```
stars = 1  // за прохождение
if moves <= level.Optimal { stars++ }  // +1 за оптимальные ходы
if firstAttempt { stars++ }            // +1 за первую попытку (нет строки в progress)
```

### Цели (Goals)
Уровни могут иметь несколько целей. Сервер валидирует все:
- `reach_finish` — игрок на клетке 3 (финиш)
- `collect_all` — собраны все предметы уровня
- `deliver_to_warehouse` — предметы доставлены на склад (клетка 7)

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
0  = пусто
1  = стена
2  = старт (начальная позиция игрока)
3  = финиш (цель/флаг)
4  = предмет (блокирует движение, можно подобрать)
5  = вода/яма
6  = телепорт
7  = склад (warehouse — для deliver_to_warehouse)
8  = кнопка/переключатель
9  = подвижная платформа
```

## Команды

```
up      - движение вверх
down    - движение вниз
left    - движение влево
right   - движение вправо
jump    - прыжок через 1-2 клетки
turn    - разворот на 180°
collect - взять предмет
drop    - положить предмет на склад
```

Набор команд зависит от сложности уровня:
- 1: up, down, left, right
- 2: +jump
- 3: +turn
- +collect / drop (если есть предметы)

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
- `static/assets/localization/bxr.json` - Буряад (Buryat)

### Сценарии (scenarios)
- `static/assets/localization/scenarios/chapter_1/chapter_1_*.json`
- `static/assets/localization/scenarios/chapter_2/chapter_2_*.json`
- Gender-specific сценарии для мальчиков и девочек

### Ключи локализации
Основные категории:
- `ui.*` - элементы интерфейса
- `commands.*` - названия команд
- `items.*` - названия предметов
- `chapters.*` - описания глав
- `hero`, `game` - общие термины