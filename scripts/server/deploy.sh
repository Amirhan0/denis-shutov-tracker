#!/usr/bin/env bash
# Деплой на сервер: свежий релиз собирается рядом с текущим, затем мгновенное переключение.
# Запускается из GitHub Actions (через ограниченный SSH-ключ) или вручную: /srv/denis/deploy.sh
set -euo pipefail
# обрыв SSH-соединения (долгая сборка без вывода) не должен прерывать деплой на середине
trap "" HUP

APP=/srv/denis
REPO=https://github.com/Amirhan0/denis-shutov-tracker.git
BRANCH=main
KEEP=3

exec 9>"$APP/deploy.lock"
flock -n 9 || { echo "Деплой уже идёт"; exit 1; }

REL="$APP/releases/$(date +%Y%m%d-%H%M%S)"
PREV="$(readlink -f "$APP/current" 2>/dev/null || true)"

echo "→ Забираю код"
git clone --quiet --depth 1 --branch "$BRANCH" "$REPO" "$REL"
cd "$REL"
ln -s "$APP/shared/.env" .env.production.local

echo "→ Устанавливаю зависимости"
npm ci --no-audit --no-fund --loglevel=error

echo "→ Собираю"
npm run build > "$REL/build.log" 2>&1 || { tail -40 "$REL/build.log"; rm -rf "$REL"; exit 1; }

echo "→ Переключаю"
ln -sfn "$REL" "$APP/current.tmp" && mv -Tf "$APP/current.tmp" "$APP/current"
sudo systemctl restart denis-tracker

ok=0
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:3000/login; then ok=1; break; fi
  sleep 1
done
if [ "$ok" != 1 ]; then
  echo "✗ Новая версия не отвечает — откатываюсь"
  if [ -n "$PREV" ]; then
    ln -sfn "$PREV" "$APP/current.tmp" && mv -Tf "$APP/current.tmp" "$APP/current"
    sudo systemctl restart denis-tracker
  fi
  exit 1
fi

# скрипт деплоя обновляет сам себя
install -m 755 "$REL/scripts/server/deploy.sh" "$APP/deploy.sh"
ls -1dt "$APP"/releases/* | tail -n +$((KEEP + 1)) | xargs -r rm -rf
echo "✓ Задеплоено: $(git rev-parse --short HEAD)"
