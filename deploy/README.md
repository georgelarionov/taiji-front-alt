# Деплой на свой сервер

Боевой хостинг проекта — VPS `5.129.221.211` (Ubuntu 26.04). Один сервер держит
всё: статический сайт, админку Payload и Postgres. Railway остаётся как архив
предыдущего деплоя, ничего с него больше не читается.

## Что где лежит

| Путь | Что это |
|---|---|
| `/opt/taiji/app` | клон репозитория (владелец — пользователь `taiji`) |
| `/var/www/taiji` | собранная статика Astro, её отдаёт Caddy |
| `/var/lib/taiji/media`, `/var/lib/taiji/documents` | загрузки Payload (картинки, PDF) |
| `/var/lib/taiji/publish.request` | файл-триггер кнопки «Опубликовать на сайте» |
| `/etc/taiji/cms.env`, `/etc/taiji/web.env` | окружение сервисов (пароли — сюда, не в репозиторий) |
| `/etc/caddy/Caddyfile` | конфиг веб-сервера |
| `/var/backups/taiji` | ежедневный дамп базы + зеркало загрузок |

## Сервисы

| Юнит | Что делает |
|---|---|
| `taiji-cms.service` | Payload/Next на `127.0.0.1:3000`, наружу только через Caddy |
| `taiji-build.service` | oneshot: пересобирает сайт из контента CMS и раскладывает в `/var/www/taiji` |
| `taiji-build.path` | следит за файлом-триггером и запускает сборку |
| `taiji-backup.timer` | ежедневный бэкап |
| `caddy.service` | TLS + отдача статики + прокси на CMS |
| `postgresql.service` | база (слушает только localhost) |

## Команды

```sh
taiji-publish            # пересобрать сайт (то же, что кнопка в админке)
taiji-update [ветка]     # git pull → пересборка CMS → пересборка сайта
taiji-golive             # переключить сервер с временного IP на боевые домены
journalctl -u taiji-build -f    # смотреть ход сборки
journalctl -u taiji-cms -f      # логи админки
```

## Как обновляется контент

Сайт статический — правки в админке попадают на него только со следующей
сборкой. Кнопка «Опубликовать на сайте» пишет метку времени в
`/var/lib/taiji/publish.request`; `taiji-build.path` видит запись и запускает
сборку. Веб-процессу при этом не нужны права на `systemctl` — он умеет только
писать в один файл (`apps/cms/src/lib/publish.ts`).

Сборка идёт ~1 минуту и раскладывается в `/var/www/taiji` только после успеха:
упавший билд не сносит живой сайт.

## Как обновляется код

```sh
sudo taiji-update            # ветка main
sudo taiji-update <ветка>
```

Автодеплоя по пушу нет — выкатка ручная и осознанная.

## Домены и TLS

Сертификаты Caddy получает и продлевает сам (Let's Encrypt), от нас нужны
только A-записи:

```
taiji-society.ru.       A   5.129.221.211
www.taiji-society.ru.   A   5.129.221.211
cms.taiji-society.ru.   A   5.129.221.211
```

Пока DNS не переключён, на сервере стоит `Caddyfile.staging`: всё доступно по
`http://5.129.221.211` (сайт в корне, админка на `/admin`), без TLS — на голый
IP сертификат не выпустить. После переключения DNS:

```sh
sudo taiji-golive
```

Скрипт проверит DNS, подставит боевые адреса в окружение, поставит боевой
`Caddyfile`, перезапустит CMS и пересоберёт сайт на правильных URL.

## Восстановление из бэкапа

```sh
sudo -u postgres dropdb taiji && sudo -u postgres createdb taiji -O taiji
pg_restore --no-owner --role=taiji -d "$DATABASE_URL" /var/backups/taiji/db-ГГГГ-ММ-ДД.dump
rsync -a /var/backups/taiji/media/ /var/lib/taiji/media/
systemctl restart taiji-cms && taiji-publish
```
