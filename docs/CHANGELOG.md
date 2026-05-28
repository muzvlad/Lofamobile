# Changelog - ЛОФА (Логика и Фантазия)

All notable changes to this project will be documented in this file.

---

## [v2.1.0] - 28.05.2026

### Security
- **Password validation** — добавлена проверка длины пароля (≥6 символов) и формата телефона (7-15 цифр, опционально `+`) на регистрации.
- **HTTP method validation** — все API-эндпоинты проверяют HTTP-метод (GET/POST) и возвращают 405 при неверном.

### Stability
- **Context key type fix** — `context.WithValue` теперь использует тип `contextKey` вместо plain string для избежания коллизий.
- **MaxLevels constant** — хардкод `20` заменён на `types.MaxLevels` во всех файлах.
- **CompleteResponse.Moves** — теперь возвращает реальное количество ходов, подтверждённое сервером, а не присланное клиентом.
- **UpdateProfile rollback** — при ошибке синхронизации leaderboard транзакция корректно откатывается.
- **Achievement data immutability** — `GetAll()` возвращает копию слайса, `GetByID()` возвращает значение, а не указатель.

---

## [v2.0.0] - 28.05.2026

### Security (Critical)
- **JWT alg:none fix** — добавлена проверка signing algorithm (HMAC-SHA256) в `ValidateToken` и `GetUserFromToken`. Предотвращает подделку токенов.
- **Stored XSS fix** — `leaderboardManager.js`: `innerHTML` заменён на `createElement` + `textContent`. Имя пользователя больше не может выполнить JS в таблице лидеров.
- **JSON.parse crash fix** — `auth.init()`: обёрнут в `try/catch`. При битых данных в localStorage приложение больше не падает.
- **CORS fix** — `Access-Control-Allow-Credentials` больше не устанавливается вместе с `Origin: *`. Установлено корректное поведение.
- **WebSocket Origin check** — добавлен `CheckOrigin` в `upgrader` для защиты от Cross-Site WebSocket Hijacking.

### Performance & Stability (Critical)
- **SQLite connection pool fix** — `MaxOpenConns` уменьшен с 25 до 1. Предотвращает `database is locked` на SQLite.
- **Data race fix** — `levels.go`: глобальный `chapterCache` защищён `sync.RWMutex`. Устранена гонка данных при параллельных запросах.
- **CompleteLevel race fix** — `db.go`: SELECT-INSERT заменён на `INSERT ... ON CONFLICT DO UPDATE` (UPSERT). Устранена гонка при одновременном завершении уровня.
- **last_insert_rowid() race fix** — `auth.go`: вызов `SELECT last_insert_rowid()` заменён на `result.LastInsertId()` из того же Exec. Избегает race через connection pool.
- **WS hub shutdown fix** — `hub.go`: добавлен канал `quit` для остановки `Run()`. Устранён double-close канала `send`.
- **Multiple run() guard** — `gameEngine.js`: флаг `isRunning` блокирует повторный запуск выполнения.
- **Duplicate event listeners fix** — `app.js`: убраны накопления обработчиков в `showLeaderboard`/`showAchievements`.

### Infrastructure
- **Rate limiter goroutine leak fix** — `ratelimit.go`: добавлен `Stop()` с каналом `stopCh` для graceful shutdown.
- **Rate limiter proxy support** — `ratelimit.go`: добавлен парсинг `X-Forwarded-For` и `X-Real-IP`.
- **log.Fatalf → error return** — `config.go`, `jwt.go`: библиотечные пакеты больше не вызывают `os.Exit`. Ошибки пробрасываются в `main()`.
- **Duplicate JWT parsing removed** — `handlers.go`: `GetUserFromToken` теперь вызывает `auth.ValidateToken` вместо дублирования логики.
- **go mod tidy** — удалена неиспользуемая зависимость `gorilla/mux`.

### Localization
- **Missing "character" key** — добавлен во все 5 языков: en, es, tg, uz, bxr.
- **chapter_1.json level 3 data fix** — `par=6, optimal=10` → `par=10, optimal=6` (было swapped).

### CSS
- **Undefined CSS variables fix** — `--danger-light`, `--success-light`, `--text-gray` добавлены в `:root` (main.css). Ранее работали только после загрузки темы.

### Code Quality
- **getLocalIP** — убран избыточный `ip[:3] != "127"` (дублировал `IsLoopback()`).
- **BroadcastScoreUpdate nil guard** — добавлена проверка `h.database == nil`.

---

## [v0.5.0] - 15.05.2026

### Added
- Бурятский язык (bxr) в системе локализации:
  - `static/assets/localization/bxr.json` - перевод интерфейса
  - `static/assets/localization/scenarios/chapter_1/chapter_1_bxr.json` - сценарии главы 1
  - Добавлен в выбор языка на всех формах (логин, регистрация, профиль)
  - Поддержка в localization.js (availableLanguages)
  - Поддержка в app.js (updateLanguageDropdowns)
- Новые предметы в levels.go: flour, bowl_of_dough, apple, broom, trash_bag, wood_boards, flag, box_tools, nails

### Changed
- Обновлена структура проекта (frontend/src/assets/components/)
- Добавлены изображения персонажей и предметов

---

## [v0.4.0] - 23.04.2026

### Added
- Модульная CSS структура:
  - `styles/main.css` - базовые стили, переменные (:root), reset
  - `styles/components.css` - все кнопки (primary-btn, secondary-btn, back-btn, etc.)
  - `styles/levels.css` - уровни, карточки, chapter-элементы, tabs
  - `styles/modal.css` - модальные окна, popups
  - `styles/game.css` - игровое поле, grid, ячейки, панель команд
  - `styles/forms.css` - формы (profile-form, gender-select, character-select)
  - `styles/colors/boy.css` - цветовая схема мальчика (отдельный CSS)
  - `styles/colors/girl.css` - цветовая схема девочки (отдельный CSS)
- Сглаживание изображений в карточках уровней (image-rendering)
- Адаптации под мобильные/планшеты/десктопы во всех модулях

### Changed
- themeManager.js - динамическая загрузка CSS файлов цветовых схем
- index.html - подключение всех CSS модулей
- main.css - удалены дубликаты (теперь в отдельных файлах)
- Обновлена документация STRUCTURE.md

### Fixed
- Квадратность изображений при уменьшении (image-rendering)

---

## [v0.3.0] - 15.04.2026

### Added
- Полная система локализации (5 языков):
  - 🇷🇺 Русский (ru)
  - 🇬🇧 English (en)
  - 🇪🇸 Español (es)
  - 🇹🇯 Тоҷикӣ (tg)
  - 🇺🇿 O'zbekcha (uz)
- Сценарии уровней для главы 1 (gender-specific)
- Все UI элементы привязаны к ключам локализации
- Команды и предметы в файлах локализации

### Fixed
- Исправлена синтаксическая ошибка HTML в index.html
- Исправлена логика переподключения WebSocket
- Исправлена ошибка с availableCommands в gameManager
- Удален дублирующий вызов auth.init()
- JWT secret теперь читается из переменной окружения

### Changed
- Все hardcoded тексты заменены на ключи локализации
- Обновлены все 5 файлов локализации (~80 ключей каждый)
- Улучшена система резервного текста (fallback)
- Обновлена документация проекта (SPEC.md, STRUCTURE.md)

---

## [v0.2.0] - 07.04.2026

### Added
- Переименование проекта в "ЛОФА - Логика и Фантазия"
- Две темы оформления (для мальчика и девочки)
- Выбор персонажа при регистрации (Строитель, Кулинар)
- Система глав (Глава 1: Знакомство и основы, Глава 2: Познание цикла)
- Блокировка уровней (замки на не пройденных уровнях)
- Сохранение достижений после прохождения уровней
- Модульная структура JavaScript
- SQLite база данных (вместо PostgreSQL)

### Changed
- Переход на SQLite для упрощения развертывания
- Оптимизация загрузки (отключен Service Worker)

---

## [v0.1.0] - 07.04.2026

### Added
- Проект создан (тогда назывался CodeQuest)
- Базовая структура Go backend
- PostgreSQL интеграция
- REST API endpoints
- WebSocket для realtime обновлений
- Система регистрации/авторизации (JWT)
- PWA структура
- Базовая документация (SPEC, GAMEDESIGN, STRUCTURE)
- Frontend HTML/CSS/JS (игровой интерфейс)
- 20 уровней (10 базовых + 10 с циклами)
- Drag & Drop редактор кода
- Таблица лидеров
- Достижения
- Разделение по полу (мальчик/девочка)

### Commands
- up, down, left, right
- jump, turn

---

## [v1.0.0] - Release

### Planned
- Релиз в Google Play
- Релиз в App Store
- Монетизация (платные миры)
- Расширение уровней (21-50)
- Дополнительные команды (if, while)
- Друзья и кланы
- Ежедневные испытания
- Звуковое сопровождение