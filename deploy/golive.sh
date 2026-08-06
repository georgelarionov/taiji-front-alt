#!/usr/bin/env bash
# Переключение сервера с временного режима (доступ по IP, HTTP) на боевые домены.
#
# Запускать ПОСЛЕ того, как A-записи taiji-society.ru / www / cms уже указывают
# на этот сервер: Caddy проверяет владение доменом через HTTP-запрос от
# Let's Encrypt, и до переключения DNS сертификат не выпустится.
#
#   sudo taiji-golive
#
# Скрипт идемпотентен — можно запускать повторно.
set -euo pipefail

[ "$(id -u)" = 0 ] || { echo "Нужен root: sudo taiji-golive"; exit 1; }

APP_DIR=/opt/taiji/app
SITE=https://taiji-society.ru
CMS=https://cms.taiji-society.ru

echo "==> Проверяю DNS"
for host in taiji-society.ru cms.taiji-society.ru; do
	ip=$(getent ahostsv4 "$host" | awk 'NR==1{print $1}')
	mine=$(curl -s https://api.ipify.org || echo '')
	echo "    $host → ${ip:-не резолвится} (сервер: ${mine:-?})"
	if [ -n "$mine" ] && [ "$ip" != "$mine" ]; then
		echo "    ! $host ещё не смотрит на этот сервер — сертификат не выпустится."
		read -rp "    Продолжить всё равно? [y/N] " a
		[ "$a" = y ] || exit 1
	fi
done

echo "==> Боевые адреса в окружении"
sed -i "s|^PAYLOAD_PUBLIC_SERVER_URL=.*|PAYLOAD_PUBLIC_SERVER_URL=$CMS|" /etc/taiji/cms.env
sed -i "s|^PUBLIC_SITE_URL=.*|PUBLIC_SITE_URL=$SITE|" /etc/taiji/cms.env
sed -i "s|^CMS_URL=.*|CMS_URL=$CMS|" /etc/taiji/web.env

echo "==> Caddy на домены"
install -m 0644 "$APP_DIR/deploy/Caddyfile" /etc/caddy/Caddyfile
systemctl reload caddy || systemctl restart caddy

echo "==> Перезапуск CMS"
systemctl restart taiji-cms
for _ in $(seq 1 60); do
	curl -sf http://127.0.0.1:3000/api/access >/dev/null && break
	sleep 2
done

echo "==> Полная пересборка сайта на боевых URL"
systemctl start taiji-build

echo
echo "Готово. Проверьте:"
echo "  $SITE"
echo "  $CMS/admin"
