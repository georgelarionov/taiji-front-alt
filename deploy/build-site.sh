#!/usr/bin/env bash
# Пересборка статического сайта из контента CMS.
#
# Запускается systemd-юнитом taiji-build.service — либо по кнопке «Опубликовать
# на сайте» в админке (через файл-триггер, см. taiji-build.path), либо руками:
#   systemctl start taiji-build
#
# Сборка идёт в apps/web/dist и только ПОСЛЕ успеха раскладывается в /var/www —
# упавший билд не должен снести живой сайт.
set -euo pipefail

APP_DIR=${APP_DIR:-/opt/taiji/app}
WWW_DIR=${WWW_DIR:-/var/www/taiji}

cd "$APP_DIR"

echo "==> Зависимости"
pnpm install --frozen-lockfile --silent

echo "==> Сборка сайта (CMS_URL=${CMS_URL:-не задан})"
pnpm --filter web build

echo "==> Раскладка в $WWW_DIR"
mkdir -p "$WWW_DIR"
rsync -a --delete "$APP_DIR/apps/web/dist/" "$WWW_DIR/"

echo "==> Готово: $(find "$WWW_DIR" -name '*.html' | wc -l) страниц"
