# UBudget Project

## Мова
Завжди відповідай українською мовою.

## Стек
- Next.js 15, TypeScript, Tailwind v4, Supabase
- UI компоненти: components/ui/
- Auth: @supabase/ssr, lib/supabase/client.ts

## Структура
- app/(app)/ — авторизована зона
- app/(landing)/ — публічна частина
- app/(landing)/free/tools/ — публічні калькулятори

## Правила
- Не дублюй код — імпортуй компоненти
- Використовуй raw <select> замість UI Select
- Next.js 15: params і searchParams — async