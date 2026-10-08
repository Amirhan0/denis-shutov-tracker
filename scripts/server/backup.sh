#!/usr/bin/env bash
# Ночная резервная копия базы (cron): хранит 30 последних
set -euo pipefail
DIR=/srv/denis/backups
mkdir -p "$DIR"
sqlite3 /srv/denis/shared/data/app.db ".backup '$DIR/app-$(date +%F).db'"
ls -1t "$DIR"/app-*.db | tail -n +31 | xargs -r rm -f
