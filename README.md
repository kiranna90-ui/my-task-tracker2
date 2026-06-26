# My Task Tracker

Нежный трекер задач на Next.js с синхронизацией через Supabase.

## Что есть в этой версии

- Данные хранятся в Supabase, поэтому телефон и компьютер видят одни и те же задачи.
- Добавлена live-синхронизация через Supabase Realtime: изменения с одного устройства появляются на другом без ручного обновления страницы.
- В дизайне обновлён верхний блок: слева от персонажа оставлен один аккуратный декоративный элемент, персонаж опущен ближе к плашке задач.
- Проект использует только `npm`, без `pnpm` и без `vercel.json` с install-командами.

## Переменные Vercel

В Vercel должны быть две переменные:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Важно: в `NEXT_PUBLIC_SUPABASE_URL` вставляй адрес без `/rest/v1/`.

## Supabase Realtime

Для live-синхронизации таблицы должны быть добавлены в publication `supabase_realtime`.

В Supabase открой SQL Editor и выполни:

```sql
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.pinned_tasks;
alter publication supabase_realtime add table public.pinned_completion;
```

Если Supabase скажет, что таблица уже добавлена, это нормально.

## Команды

```bash
npm install
npm run build
```
