# Страница «Новости» (`/news`) — дизайн

**Дата:** 2026-06-09
**Источник дизайна:** MagicPath `taiji-front` — фреймы `News` (`safe-river-5065`, десктоп) и `NewMobile` (`luckily-park-9386`, мобайл).

## Цель

Новая внутренняя страница-лента новостей на роуте `/news`, собранная на фундаменте проекта (`docs/conventions.md`): тот же шелл, что у `/taijiquan`. Контент — 12 заглушек; 6 видны сразу, ещё 6 раскрываются по кнопке «Показать ещё».

## Решения (утверждено пользователем)

- **Роут:** `/news` (не `/mobile` из исходной постановки).
- **Количество:** 12 карточек — 6 сразу + 6 по «Показать ещё».
- **Механизм «Показать ещё»:** zero-JS через `<details>/<summary>` (вариант C). Никакого JS-острова — не ломается под `<ClientRouter />`, доступно с клавиатуры.
- **Кнопка «Показать ещё»:** в дизайне отсутствует — добавляем. Ghost-стиль: `border-accent` + `text-accent`, заливка `bg-accent`/`text-white` на hover. Прячется при раскрытии (`details[open] summary{display:none}`).

## Шелл (как `/taijiquan`)

```
BaseLayout (title/description под SEO)
  Header  variant="solid" activeNav="Новости"   (bg surface)
  Breadcrumbs items=[{Главная, /}, {Новости}]    (bg surface)
  NewsHero
  NewsList (items=12, initial=6)
  Footer                                         (глобальный)
```

## Компоненты

### `components/news/NewsHero.astro`
Full-bleed баннер-заголовок. `bg-surface`, `border-y border-border`, заголовок «Новости» по центру.
- Десктоп: высота ≈241px, h1 56px Cormorant 600 → маплю на `text-h1` (60/40px, font-serif).
- Мобайл: высота ≈200px, h1 40px (точно совпадает с `text-h1` max-lg).
- Орнамент-фон из дизайна опускаем на этом этапе (как «Footer banner bg omitted» — добавится ассетом позже). Полоса остаётся `bg-surface`.

### `components/news/NewsCard.astro`
Одна карточка-новость. Props: `{ date, title, excerpt }`. Десктоп-first + `max-lg:` оверрайды (значения по нодам):

| Элемент | Десктоп | Мобайл |
|---|---|---|
| контейнер | `max-w-[809px]`, flex-col gap 24px | gap 32px |
| дата | Manrope 500, 16px | 16px |
| заголовок (`<h2>`) | Manrope 600, 28px / lh 34 | 24px / lh 28.8 |
| фото-бокс | `bg-field`, h 455px, центр | h 200px |
| фото-плейсхолдер | 317×423, `bg-surface-sunken` | 138×184 |
| лид (`<p>`) | Inter 500, 18px, `text-ink/70`, lh 24 | 16px, lh 25.6 |
| кнопка «Читать далее» | `bg-accent` white, Manrope 600 16px, px24 py16, `href="#"`, `hover:bg-accent/90` | то же |

Семантика: заголовок карточки = `<h2>` (статьи в ленте — секции страницы под единственным `<h1>` героя). Размер 28/24px берётся точно по дизайну (промежуток между `text-h2-compact` и `text-h3` — type-scale-уровня нет, исключение ради точности).

### `components/news/NewsList.astro`
Лента: `mx-auto max-w-[809px]`. Между карточками — `<hr>`-разделитель `border-border` (по дизайну gap 32/40px с линией по центру). Первые 6 карточек статичны; кнопка + остальные 6 — внутри `<details>`:
```
<NewsCard/> ×6  (разделители между)
<details>
  <summary>Показать ещё</summary>   ← ghost-кнопка, центр; прячется при [open]
  <hr/> <NewsCard/> ×6               ← первый <hr> = разделитель между 6 и 7
</details>
```
Маркер `<details>` убираем (`list-none`, `::-webkit-details-marker`); под `prefers-reduced-motion` ничего не анимируем (раскрытие мгновенное). Scoped `<style>` в этом компоненте.

### `pages/news.astro`
Шелл + массив из 12 заглушек (дата/заголовок/лид — повторяющийся стаб-контент, как в существующем `News.astro`; CMS позже). SEO title/description под страницу.

## Доступность
- Один `<h1>` (герой), заголовки карточек `<h2>`.
- `<details>/<summary>` — фокусируемо, Enter раскрывает; `aria-current="page"` на крошке «Новости» (через `Breadcrumbs`).
- Активный пункт шапки «Новости» (`aria-current` через `Header`).

## Вне объёма
- Реальные фото/ссылки новостей (заглушки, `href="#"`).
- Орнамент-фон героя (ассет позже).
- Отдельная страница статьи (новость не кликается в детальную).

## Верификация
`pnpm check` + `pnpm build`. Визуальный рендер ревьюит пользователь (Playwright — только по явной просьбе).
