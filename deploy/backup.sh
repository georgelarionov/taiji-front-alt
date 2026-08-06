#!/usr/bin/env bash
# Ежедневный локальный бэкап контента: дамп базы + зеркало загруженных файлов.
#
# Запускается таймером taiji-backup.timer. Кладёт всё в /var/backups/taiji.
# ВАЖНО: это копия на том же диске — она спасает от ошибки редактора и кривой
# миграции, но не от гибели сервера. Копию наружу (S3, другой хост) настраивать
# отдельно.
set -euo pipefail

DIR=/var/backups/taiji
KEEP_DAYS=30

mkdir -p "$DIR"
set -a; . /etc/taiji/cms.env; set +a

pg_dump "$DATABASE_URL" --format=custom --file="$DIR/db-$(date +%F).dump"
rsync -a --delete /var/lib/taiji/media/ "$DIR/media/"
rsync -a --delete /var/lib/taiji/documents/ "$DIR/documents/"

find "$DIR" -maxdepth 1 -name 'db-*.dump' -mtime "+$KEEP_DAYS" -delete
