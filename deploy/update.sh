#!/usr/bin/env bash
# Выкатка новой версии кода: git pull → пересборка CMS → пересборка сайта.
#
#   sudo taiji-update            # текущая ветка сервера
#   sudo taiji-update <ветка>    # переключиться на другую
#
# По умолчанию берём именно ТЕКУЩУЮ ветку, а не main: иначе запуск без аргумента
# молча откатил бы сервер на другую ветку.
#
# Контент при этом не трогается: он в базе и на диске, а не в репозитории.
set -euo pipefail

[ "$(id -u)" = 0 ] || { echo "Нужен root: sudo taiji-update"; exit 1; }

APP_DIR=/opt/taiji/app
BRANCH=${1:-$(sudo -u taiji git -C "$APP_DIR" rev-parse --abbrev-ref HEAD)}
echo "==> Ветка: $BRANCH"

echo "==> git pull ($BRANCH)"
sudo -u taiji git -C "$APP_DIR" fetch --prune origin
sudo -u taiji git -C "$APP_DIR" checkout "$BRANCH"
sudo -u taiji git -C "$APP_DIR" reset --hard "origin/$BRANCH"

echo "==> Зависимости"
sudo -u taiji env HOME=/opt/taiji pnpm -C "$APP_DIR" install --frozen-lockfile

echo "==> Сборка CMS"
set -a; . /etc/taiji/cms.env; set +a
sudo -u taiji env HOME=/opt/taiji \
	DATABASE_URL="$DATABASE_URL" PAYLOAD_SECRET="$PAYLOAD_SECRET" \
	PAYLOAD_PUBLIC_SERVER_URL="$PAYLOAD_PUBLIC_SERVER_URL" PUBLIC_SITE_URL="$PUBLIC_SITE_URL" \
	MEDIA_DIR="$MEDIA_DIR" DOCUMENTS_DIR="$DOCUMENTS_DIR" \
	NODE_OPTIONS="--no-deprecation --max-old-space-size=3072" \
	pnpm -C "$APP_DIR/apps/cms" run build

echo "==> Перезапуск CMS"
systemctl restart taiji-cms
for _ in $(seq 1 60); do
	curl -sf http://127.0.0.1:3000/api/access >/dev/null && break
	sleep 2
done

echo "==> Пересборка сайта"
systemctl start taiji-build
echo "Готово."
