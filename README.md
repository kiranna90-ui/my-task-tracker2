# My Task Tracker

Обновлённая версия трекера задач.

## Что изменено

- На вкладке «День» убраны предустановленные варианты задач в выпадающем списке.
- Осталось простое поле ввода: можно писать время и задачу, например `09.30 прогулка`.
- Вкладка «Месяц» удалена — остались только «День» и «Неделя».
- На вкладке «Неделя» показываются только задачи, у которых указано время.
- Добавлены favicon, Apple touch icon и web manifest для иконки во вкладке браузера и при добавлении приложения на домашний экран.
- Убран внешний Google Font, чтобы сборка не зависела от доступа к Google Fonts.

## Локальный запуск

```bash
npm install
npm run dev
```

## Проверка сборки

```bash
npm run build
npm run typecheck
```

## Публикация на GitHub

```bash
git init
git add .
git commit -m "Simplify tracker and add app icon"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

После этого проект можно подключить к Vercel: импортируйте репозиторий из GitHub, оставьте стандартные настройки Next.js и нажмите Deploy.

## Android icon / PWA

В проект добавлены Android-иконки для установки на домашний экран:

- `public/android-chrome-192x192.png`
- `public/android-chrome-512x512.png`
- `public/maskable-icon-192x192.png`
- `public/maskable-icon-512x512.png`
- `public/manifest.webmanifest`

Manifest подключён в `app/layout.tsx`. После деплоя на HTTPS сайт можно добавить на домашний экран Android через меню браузера Chrome: «Добавить на главный экран» / «Установить приложение».

## Публикация на GitHub вручную

1. Создайте пустой репозиторий на GitHub: **New repository** → имя репозитория → **Create repository**. Не добавляйте README, `.gitignore` или license, если хотите загрузить этот проект как есть.
2. Распакуйте архив проекта и откройте папку проекта в терминале.
3. Выполните команды, заменив `YOUR_USERNAME` и `YOUR_REPO` на свои значения:

```bash
git init
git add .
git commit -m "Add Android PWA icons"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Если GitHub попросит авторизацию, войдите через браузер/GitHub Desktop или используйте Personal Access Token вместо пароля.

