# Task Tracker

Обновлённая версия трекера с синхронизацией через Supabase.

## Что добавлено

- подключён `@supabase/supabase-js`;
- обычные задачи сохраняются в таблицу `tasks`;
- закреплённые задачи сохраняются в таблицу `pinned_tasks`;
- выполнение закреплённых задач по дням сохраняется в `pinned_completion`;
- приложение загружает данные из Supabase при открытии, поэтому задачи одинаковые на телефоне и компьютере;
- если переменные Supabase не заданы, приложение использует локальное хранилище как запасной режим.

## Переменные в Vercel

В Vercel → Project → Settings → Environment Variables должны быть:

```env
NEXT_PUBLIC_SUPABASE_URL=твоя ссылка Supabase проекта
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=твой Publishable key или anon public key
```

Для опубликованного сайта достаточно выбрать `Production` и `Preview`.

## Supabase

В Supabase открой SQL Editor → New query и запусти файл:

```text
supabase-setup.sql
```

Он создаёт/обновляет нужные таблицы и политики доступа.

## Запуск локально

```bash
npm install
npm run dev
```

## Проверка перед публикацией

```bash
npm run lint
npm run build
```

## Обновление GitHub вручную

1. Распакуй архив.
2. Открой репозиторий GitHub.
3. Нажми Add file → Upload files.
4. Перетащи все файлы и папки из распакованного проекта.
5. Не загружай `node_modules` и `.next`.
6. Нажми Commit changes.
7. В Vercel дождись нового деплоя или нажми Redeploy.

## Vercel / npm only

Этот архив очищен для деплоя через npm:

- `pnpm-lock.yaml` удалён;
- `vercel.json` удалён, чтобы Vercel использовал стандартные настройки Next.js;
- оставлен `package-lock.json`;
- в `package.json` указан `packageManager: npm@11.5.1`;
- Supabase подключён через переменные окружения `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

После загрузки на GitHub в Vercel проверь, что Install Command не переопределён вручную. Лучше выключить Override.
