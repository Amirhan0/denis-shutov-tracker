# Денис Шутов | Психолог — платформа с трекерами

Next.js 16 + SQLite через libSQL: в продакшене база в [Turso](https://turso.tech), локально — файл `./data/app.db`.

## Быстрый старт

```bash
npm install
npm run seed-demo      # демо только в локальный файл: admin@demo.ru / demo12345, клиенты anna@ / maria@ / ivan@demo.ru
npm run dev            # http://localhost:3000
```

## Что внутри

| Раздел | Путь |
|---|---|
| Главная, «Как это работает», трекеры, PDF, о Денисе | `/` |
| Регистрация → выбор привычек → кабинет | `/register` → `/app/welcome` → `/app` |
| Вход / восстановление / смена пароля | `/login`, `/forgot`, `/reset/[token]`, `/app/settings` |
| Быстрое заполнение всего дня (сценарий «1–2 минуты с телефона») | `/app/today` |
| Рейтинг дня, Тревожность, Настроение (месяц + годовая таблица) | `/app/rating`, `/app/anxiety`, `/app/mood` |
| Полезные привычки (до 5, история при замене сохраняется) | `/app/habits` |
| Главное за день, Благодарность себе (автосохранение) | `/app/main`, `/app/gratitude` |
| Еженедельная статистика (описательная) | `/app/stats` |
| Админка: клиенты, карточка клиента, фильтр периода, задания | `/admin`, `/admin/clients/[id]` |
| Редактирование набора настроений | `/admin/moods` |
| PDF-трекеры для печати | `/pdf`, файл `public/trackers.pdf` |

«Задания от психолога» уже работают: Денис пишет задание в карточке клиента — клиент видит его на главной кабинета.

## Запуск на Vercel

1. Vercel → **Add New → Project** → импортировать репозиторий с GitHub.
2. **Settings → Environment Variables**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `APP_URL`, `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_TELEGRAM_URL`, `NEXT_PUBLIC_CONTACT_EMAIL` (по желанию — `SMTP_*`).
3. **Settings → Functions → Function Region**: тот же регион, что у базы Turso (например, Frankfurt `fra1`). Иначе каждый запрос к базе будет медленнее.
4. Создать аккаунт Дениса (берёт ключи Turso из `.env.local`):
   ```bash
   npm run create-admin -- denis@mail.ru 'надёжный-пароль' 'Денис'
   ```

Таблицы в базе создаются автоматически при первом запросе.

## Запуск на своём сервере (VPS)

```bash
npm ci && npm run build
npm run create-admin -- denis@mail.ru 'надёжный-пароль' 'Денис'
npm start                          # порт 3000, держать через pm2 / systemd
```

HTTPS — через Caddy:

```
shutov-psy.ru {
  reverse_proxy localhost:3000
}
```

Без `TURSO_*` данные хранятся в файле `./data/app.db` на сервере.

## Безопасность данных

- пароли хранятся в bcrypt, сессии — случайные токены, в базе только их SHA-256;
- cookie `httpOnly` + `secure` + `sameSite=lax`, заголовки HSTS / X-Frame-Options / nosniff;
- роли `client` и `admin`: все запросы клиента фильтруются по его `user_id` из сессии, админка проверяет роль на сервере;
- автовыход после `SESSION_IDLE_MINUTES` бездействия (и на сервере, и в браузере);
- ограничение попыток входа, согласие с политикой при регистрации;
- резервные копии: Turso хранит свои и умеет восстанавливать базу на нужный момент; дополнительно `npm run backup` выгружает все данные в JSON (30 последних в `./backups`).

## Что заменить перед запуском

- ссылки Instagram / Telegram / email — в `.env` (`NEXT_PUBLIC_*`);
- фото и текст о Денисе — `src/app/page.tsx`, блок `#about`;
- текст политики конфиденциальности — `src/app/privacy/page.tsx` (нужны реквизиты оператора по 152-ФЗ);
- после правок в `/pdf` пересоздать PDF: `npm run pdf` (при запущенном сайте).
