# Денис Шутов | Психолог — платформа с трекерами

Next.js 16 + SQLite (libSQL). База — файл `./data/app.db` (на сервере — `/srv/denis/shared/data/app.db`). Умеет работать и с [Turso](https://turso.tech) через `TURSO_*`.

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

## Продакшен: denis-shutov.com (VPS PS.kz)

Сервер `ubuntu@77.240.39.53`, Ubuntu 24.04. Node.js 24, Caddy (HTTPS от Let's Encrypt, продлевается сам).

**Деплой автоматический:** `git push` в `main` → GitHub Actions (`.github/workflows/deploy.yml`) заходит на сервер ключом из секрета `DEPLOY_KEY` → запускается `/srv/denis/deploy.sh`. Скрипт собирает новый релиз рядом с текущим, переключает симлинк и перезапускает сервис. Если новая версия не отвечает, он откатывается на предыдущую. Этот ключ на сервере умеет только запускать деплой.

```
/srv/denis/
  current -> releases/<время>   # работающая версия (хранятся 3 последних)
  shared/.env                    # DATABASE_PATH, APP_URL
  shared/data/app.db             # база SQLite
  backups/                       # ночные копии базы (3:00, 30 последних)
  deploy.sh, backup.sh
```

Полезные команды на сервере:

```bash
sudo systemctl status denis-tracker      # состояние сайта
journalctl -u denis-tracker -f           # логи
/srv/denis/deploy.sh                     # деплой вручную
cd /srv/denis/current && npm run create-admin -- почта 'пароль' 'Имя'
```

Конфиги сервера лежат в `scripts/server/` (systemd-сервис, Caddyfile, бэкап).

Старый адрес `denis-shutov-tracker.vercel.app` перенаправляет на `denis-shutov.com` (`next.config.ts`, только при сборке на Vercel). Перенос данных из Turso выполнен скриптом `scripts/turso-to-file.mjs`.

## Безопасность данных

- пароли хранятся в bcrypt, сессии — случайные токены, в базе только их SHA-256;
- cookie `httpOnly` + `secure` + `sameSite=lax`, заголовки HSTS / X-Frame-Options / nosniff;
- роли `client` и `admin`: все запросы клиента фильтруются по его `user_id` из сессии, админка проверяет роль на сервере;
- автовыход после `SESSION_IDLE_MINUTES` бездействия (и на сервере, и в браузере);
- ограничение попыток входа, согласие с политикой при регистрации;
- резервные копии: каждую ночь в 3:00 на сервере (`/srv/denis/backups`, 30 последних).

## Что заменить перед запуском

- ссылки Instagram / Telegram / email — в `.env` (`NEXT_PUBLIC_*`);
- фото и текст о Денисе — `src/app/page.tsx`, блок `#about`;
- текст политики конфиденциальности — `src/app/privacy/page.tsx` (нужны реквизиты оператора по 152-ФЗ);
- после правок в `/pdf` пересоздать PDF: `npm run pdf` (при запущенном сайте).
