# Git инструкция для LofaMobile

## Как загрузить изменения на GitHub

### 1. Проверить статус изменений
```bash
cd C:\Users\Muzika\Documents\Projects\LofaMobile
git status
```

### 2. Добавить файлы в коммит
```bash
git add .
```

### 3. Создать коммит
```bash
git commit -m "Описание изменений"
```

### 4. Загрузить на GitHub
```bash
git push
```

## Как скачать обновления с GitHub
```bash
git pull
```

## Как создать бэкап (ветку)
```bash
git branch backup-дата
git push origin backup-дата
```

## Важное примечание
Токен для GitHub сохранён в URL remote. При следующих push/pull командах он будет использоваться автоматически.

## Если нужно обновить токен
1. Создать новый токен на: https://github.com/settings/tokens
2. Обновить remote:
```bash
git remote set-url origin https://muzvlad:НОВЫЙ_ТОКЕН@github.com/muzvlad/Lofamobile.git
```