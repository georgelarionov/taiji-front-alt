# Конвенции дизайн-системы и подход PC/Mobile

Living-doc для сборки **новых** страниц консистентно с тем, что уже в коде. Дополняет
`CLAUDE.md` (там — архитектура рантайма, лоудер/hero-контракт, page composition, гочи), здесь —
**правила вёрстки**: контейнер/сетка, токены, типошкала, ассеты, доступность, SEO-шелл, верификация.

Документ описывает **фактическое** состояние кода. Существующие компоненты главной под все правила
не рефакторим (намеренные локальные исключения отмечены ниже и в разделе «Открытые/отложенные»).

Источник истины:
- токены/утилиты/типошкала — `apps/web/src/styles/global.css`
- навигация/соцсети — `apps/web/src/config/nav.ts`, `apps/web/src/config/socials.ts`
- иконки — `apps/web/src/lib/icons.ts`
- шелл — `apps/web/src/layouts/BaseLayout.astro`, `apps/web/src/components/Header.astro`

---

## 1. Контейнер и сетка

Стандартный (не full-bleed) блок оборачивается утилитой **`.container-block`**:

```html
<section …>
  <div class="container-block">…контент…</div>
</section>
```

`.container-block` = `mx-auto w-full max-w-[1440px] px-11 max-lg:px-4` →
**1352px** контента + гаттеры **44px** на десктопе, **16px** на мобиле (`max-lg`).
Заменяет повтор этих классов по блокам — пиши класс, а не строку.

**Full-bleed** блоки (фон/секция во всю ширину, контент — в колонке): фон/секция на полную
ширину, а внутреннюю колонку прижимаем только горизонтальными гаттерами утилитой **`.gutter-x`**
(`px-11 max-lg:px-4` — те же 44/16px без `max-w`/центрирования). Так сделаны шапка и нижняя
плашка Hero, меню.

CSS-переменные-эталоны лежат в `:root` (`global.css`): `--content-max: 1440px`,
`--gutter: 2.75rem` (= 44px = `px-11`). Это документирующие значения в одном месте; сами
утилиты собраны из Tailwind-классов.

**Важно (гоча):** любой full-bleed/шире-вьюпорта элемент (фоновый `<Image>`, `w-screen`,
выезжающий слайдер) → на секцию ставь **`overflow-x-clip`**, иначе появится горизонтальный
скролл страницы. Проверка: `scrollWidth ≤ innerWidth`.

---

## 2. Подход PC / Mobile

**Desktop-first.** Базовые классы = десктоп; мобильные оверрайды добавляются вариантом
**`max-lg:`**.

- `lg` = **1024px**, значит мобайл = **< 1024px**; планшеты получают мобильную раскладку.
- Пример (из Hero): десктопный `<ul>` навигации скрывается `max-lg:hidden`; остаётся бургер.

**Правило 4px-сетки + Tailwind-шкала:**
- Все мобильные отступы/размеры кратны 4 (4/8/12/16/20/24…).
- **Если значение есть на Tailwind-шкале — пиши шкалой**, не произвольным px:
  `gap-10` (= 40px), а **не** `gap-[40px]`; `py-24`, `px-4`, `gap-8` и т.п.
- Произвольные `[…px]` — только для реально нестандартных величин, которых нет на шкале
  (`gap-[46px]`, `min-h-[263px]`, `text-[40px]`).

**Локальное исключение (НЕ повторять на новых страницах):** в `Footer.astro` остались
`gap-[14px]` / `gap-[10px]` — это разнобой с правилом (14/10 не на 4px-сетке и есть близкие
`gap-3.5`/`gap-2.5`). На главной не трогаем, но новые страницы так не верстаем.

Эталон мобильной реализации — **Hero** (`Header.astro` + `HeroSlider.tsx`): `max-lg:hidden`
на десктоп-навигации, фиксированный `max-lg:h-10` логотип, CTA на всю ширину.

---

## 3. Цветовые токены

Все цвета — из `@theme` в `global.css`. **Новый цвет ТОЛЬКО через токен** — никаких
`bg-[#hex]` / `text-[#hex]` в разметке.

| Токен | Значение | Утилиты / назначение |
|---|---|---|
| `--color-ink` | `#0d1014` | `text-ink`, `bg-ink` — основной текст, тёмная база (не чистый чёрный, холодный подтон в тон акценту) |
| `--color-surface` | `#f7f5f4` | `bg-surface` — карточки, hover-подложки |
| `--color-surface-sunken` | `#f2f1ef` | `bg-surface-sunken` — фоны блоков/секций (Research) |
| `--color-surface-overlay` | `#e8e6e1` | фон полноэкранного меню / оверлеев |
| `--color-field` | `#eeece9` | `bg-field` — бежевые pill-поля (Contacts) |
| `--color-border` | `#0d1014` @ 15% (`color-mix`, полупрозрачный ink) | `border-border`, `bg-border` — разделители |
| `--color-accent` | `#023c97` | `text-accent`, `bg-accent` — основной синий акцент |
| `--color-accent-soft` | `#e6ebf5` (~10% акцента) | мягкие кнопки/подложки |

**Тени** (тоже токены): `shadow-card` (`0 20px 45px -15px` ink 25%) и
`shadow-popover` (`0 14px 48px` ink 16%). Используй утилиты `shadow-card` / `shadow-popover`,
не пиши тень вручную.

Полупрозрачные оттенки текста делаем через слэш-алфу токена: `text-ink/70`, `text-ink/65`,
`bg-accent/50` (см. раздел 8 про минимальную приглушённость — не ниже `/70`).

---

## 4. Типошкала

Семантические классы-композиты живут в `@layer components` (`global.css`): **семейство +
размер (десктоп) + leading + вес**, с мобильным `max-lg:` оверрайдом. Это **стандарт для
новых страниц** (существующие компоненты под них не рефакторим — там те же значения, но инлайном).

| Класс | Семейство | Desktop | Mobile (`max-lg`) | Вес |
|---|---|---|---|---|
| `.text-h1` | `font-serif` (Cormorant) | 60px / `leading-[1.05]` | 40px | — |
| `.text-h2` | `font-display` (Manrope) | 40px / `leading-[1.1]` | 30px | `font-semibold` |
| `.text-h2-compact` | `font-display` | 32px / `leading-[1.1]` | 26px | `font-semibold` |
| `.text-banner` | `font-display` | 40px / `leading-[1.1]` | 22px | `font-extrabold` |
| `.text-h3` | `font-display` | `text-2xl` (24px) / `leading-tight` | 20px | `font-semibold` |
| `.text-name` | `font-serif` (Cormorant) | 39px / `leading-none` | 28px | `font-semibold` |
| `.text-body` | `font-sans` (Inter) | `text-base` (16px) / `leading-relaxed` | 15px | — |
| `.text-eyebrow` | `font-display` | 12px `uppercase` `tracking-wide` | — | `font-bold` |
| `.text-caption` | `font-display` | `text-sm` (14px) | 13px | `font-semibold` |

**Намеренно отдельные уровни (это не ошибки/дубли):**
- `.text-h2-compact` (32px) — для Society, где заголовок меньше обычного `h2`.
- `.text-banner` (`font-extrabold`) — для центрального баннера Footer; отличается весом от `h2`.

**Шрифт-токены** (через `@theme inline`, резолвятся в семейства Astro Fonts API):
- `font-serif` → **Cormorant Garamond** — заголовки / hero / цитаты
- `font-display` → **Manrope** — подзаголовки / кнопки / eyebrow
- `font-sans` → **Inter** — body / UI (базовый в `<body>`)

Веса/курсивы добавляются в конфиге Astro Fonts API (`astro.config.mjs` / провайдер), не через
сырой `@font-face`.

---

## 5. Навигация и соцсети — единый источник

Состав навигации и соцсетей **не дублируем по компонентам** — берём из конфигов; компоненты
(`Header` / `Menu` / `Footer`) только импортируют и раскладывают.

`src/config/nav.ts`:
- **`navCols: NavCol[]`** — колонки полноэкранного меню/футера (`title` + `href` + `links[]`):
  «Тайцзицюань», «Общество», «Исследования» с подпунктами.
- **`bigLinks: NavLink[]`** — крупные ссылки (Новости / Мероприятия / Медиа-архив / Контакты).
- **`topNav: NavLink[]`** — горизонтальное меню в шапке Hero (только десктоп).

`src/config/socials.ts`:
- **`socials: Social[]`** — `id` / `alt` / `href` (messenger / telegram / whatsapp / vk).
  Сами ассеты-иконки остаются локальными в компонентах (разные форматы/размеры) и
  подбираются по `id`.

Новая страница, которой нужна навигация/соцсети, импортирует эти массивы — **не хардкодит** свой
список.

**Иконки (SVG-пути)** — `src/lib/icons.ts`, единый источник геометрии:
- `ARROW_PATH` — стрелка карусели (общая для всех слайдеров).
- `INFO_PATH` — иконка ⓘ (About / Society).

Прочие одноразовые пути иконок (конверт/телефон в Contacts) живут в своём компоненте локально —
переноси в `icons.ts`, только когда путь начинает переиспользоваться.

---

## 6. Ассеты — что чем сервить

| Тип | Как |
|---|---|
| **Фото** (hero, имагери) | Astro `<Image>` / `getImage()` с `widths`+`sizes` → адаптивный webp (`sharp`). Даунскейл hi-res источника. |
| **Крупные текстуры-фоны** | `<Image>` / `getImage()` webp + `loading="lazy"` (фоновый декор, не критичный для LCP). |
| **Мелкая флэт бренд-графика / лого / иконки-растры** | обычный `<img src={import.src}>`, **НЕ `<Image>`** — webp пережимает мелкую флэт-графику с артефактами. Пример — лого в шапке. |
| **SVG** | `import x from "…/x.svg?url"` → `<img src={x}>` (интенсивность через CSS `opacity`). **Инлайнить** `<svg>` — только для крошечных иконок с `currentColor` или когда путь анимируется (drawn-stroke/mask: импорт `?raw` + извлечь `d`). |

**Каталоги ассетов** — семантические имена по блокам:
`src/assets/{hero,about,news,research,society,contacts,footer,menu,loader}/`.
Реальные ассеты из `assets-dev/` копируются в `src/assets/<block>/`.

**Гоча MagicPath-превью:** `<img src=".svg">` не рендерится в MagicPath-сборках —
для канваса растеризуй SVG→PNG или инлайнь `<svg>`; CJK-глифы (太极拳) тофуют в headless —
грузи Noto Serif SC через Google Fonts с `&text=<только нужные символы>`.

---

## 7. Острова и анимации

**Гидрация островов:**
- **Слайдеры → `client:load`** (НЕ `client:visible`): hydrate-on-scroll мигал/«пропадал» под
  `<ClientRouter />`. Все три слайдера (`HeroSlider` / `ResearchSlider` / `SocietySlider`)
  загружаются `client:load`.
- **Не-критичные интерактивы** (поповер-справка `AboutInfo`) → `client:idle` — гидрируются в
  простое, не блокируют первый кадр.

**Рантайм-анимации (Lenis / GSAP / любые JS-driven):** регистрировать на верхнем уровне модуля
и завязывать на жизненный цикл `<ClientRouter />`:
- init → **`astro:page-load`** (срабатывает и на первой загрузке, и на каждой SPA-навигации)
- teardown → **`astro:before-swap`**

Не использовать `DOMContentLoaded` — иначе анимации «отвалятся» после навигации. Эталон —
`src/lib/smooth.ts` (там же `setupHeroParallax()`); меню — `src/lib/menu.ts`.

**`prefers-reduced-motion` уважать ВЕЗДЕ:**
- CSS — `@media (prefers-reduced-motion: …)` / Tailwind `motion-reduce:` варианты.
- React-острова — `useReducedMotion` или `window.matchMedia("(prefers-reduced-motion: reduce)")`
  (так делают `HeroSlider`/`smooth.ts`: при reduce ранний `return`, анимация не запускается).

**Reveal / скрытие контента — только под `html.js`:** начальное `opacity:0` для `[data-reveal]`
/ `[data-reveal-item]` / `[data-reveal-bg]` и пунктов меню задано **под `html.js`** (класс
ставит инлайн-скрипт в `<head>` до пейнта). Без JS контент виден; под reduced-motion `opacity`
возвращается в 1. Новый reveal-эффект делать так же — никогда не скрывать контент безусловно.
Reveal на самом нижнем элементе страницы не ставить (ScrollTrigger `top 85%` недостижим на
максимальном скролле — останется невидимым).

---

## 8. Доступность — чеклист новой страницы

- **Один `<main id="main">`** — уже есть в `BaseLayout` (страница рендерится в его `<slot/>`,
  свой `<main>` не добавлять). Skip-link («К основному содержимому») — первый фокусируемый
  элемент, прыгает на `#main` (тоже в `BaseLayout`).
- **Иерархия заголовков** `h1 → h2 → h3` без перескоков; ровно один `h1` на страницу.
- **Видимый фокус** — глобальный `:focus-visible` в `global.css` (accent-обводка + белое гало,
  работает и на тёмном hero, и на синих кнопках). `:where(...)` = нулевая специфичность, можно
  переопределить в компоненте. **`outline:none` нигде не вводить.**
- **`alt` / `aria`:** значимые изображения — осмысленный `alt`; декоративные —
  `alt=""` + `aria-hidden="true"` (как фоны в Contacts). Иконки-`<svg>` — `aria-hidden="true"`,
  если рядом есть текст.
- **Контраст AA:** обычный текст ≥ **4.5:1**, крупный (≥24px / ≥18.66px bold) ≥ **3:1**.
  Приглушённый текст не делать ниже **`/70`** (`text-ink/70` — нижняя граница; `/65` в About —
  пограничный существующий случай, новые блоки держим ≥ `/70`).
- **Иноязычные глифы:** на CJK-фрагменты (太极拳) ставить **`lang="zh-Hans"`** на обёртке
  (сейчас в коде главной этого нет — добавлять на новых страницах для корректного озвучивания
  скринридерами и подбора шрифта).
- **Модалки / оверлеи — `inert` фона:** при открытии полноэкранного оверлея ставить `inert` на
  `#main` (так делает `menu.ts`: `document.getElementById("main").setAttribute("inert","")` на
  открытии, снимает на закрытии и на `astro:before-swap`). Оверлей — `role="dialog"` +
  `aria-modal="true"`; кнопка-открыватель — `aria-haspopup="dialog"`, `aria-controls`,
  `aria-expanded` (синхронизировать строкой). Esc закрывает, скролл блокируется (`html.menu-open`
  → `overflow:hidden`).
- **`aria-current` корректно:** значение — **строка** или `undefined`, не булево:
  `aria-current={active ? "true" : undefined}` (как в `HeroSlider`/`SocietySlider` для активной
  точки пагинации). Для активного пункта навигации — `aria-current="page"`.

---

## 9. SEO / шелл

Новая страница **обязательно** использует `BaseLayout`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import Header from "../components/Header.astro";
import Breadcrumbs from "../components/Breadcrumbs.astro";
import Footer from "../components/Footer.astro";
---
<BaseLayout title="…" description="…">
  <Header variant="solid" activeNav="…" />
  <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "…" }]} />
  …блоки страницы…
  <Footer />
</BaseLayout>
```

**Props `BaseLayout`** (все опциональны, есть дефолты):
- `title` / `description` — `<title>`, `<meta description>`, og:title/description.
- `ogImage` — путь к превью (резолвится в абсолютный URL от `site`).
- `noindex` — для служебных страниц (404 и т.п.) → `<meta name="robots" content="noindex, nofollow">`.

**Что даёт шелл из коробки** (не дублировать на странице):
- `<main id="main">` + skip-link;
- глобальные стили, шрифты (`<Font/>`), `<ClientRouter/>` (View Transitions);
- `<Menu />` (полноэкранное меню) — **в шелле**, на странице не подключаем;
- SEO-`<head>`: canonical (от `site`), Open Graph (`og:type/site_name/locale=ru_RU/title/
  description/url/image`), Twitter card;
- **`<slot name="head" />`** — для пер-страничных preload/meta:
  `<Fragment slot="head">…</Fragment>`;
- рантаймы `smooth` / `menu` (+ лоудер, сейчас временно отключён в `BaseLayout`).

**Глобальные Header / Footer / Menu:**
- **Menu** — в шелле (см. выше).
- **Header** (`Header.astro`) — два варианта (геометрия одна, меняется только цвет/состояние):
  `variant="overlay"` (светлая шапка поверх hero — главная, `Hero` через `slot="header"`) и
  `variant="solid"` + `activeNav` (внутренние страницы: синее лого `assets/header/logo-blue.webp`,
  фон `surface` + нижний бордер, тёмный текст/бургер; активный пункт topNav по `activeNav` =
  `text-accent` + постоянный нижний бордер + `aria-current="page"`). Эталон — `taijiquan.astro`.
- **Breadcrumbs** (`Breadcrumbs.astro`) — отдельный статичный блок под шапкой на внутренних
  страницах (проп `items: {label, href?}[]`; последний без `href` = текущая страница →
  `text-ink/70` + `aria-current="page"`); `bg-surface` + нижний бордер, продолжает плашку шапки.
- **Footer** — **импортируется на самой странице** (а не в шелле), последним блоком (см. пример
  выше, `index.astro` / `taijiquan.astro`).
- **Фоны секций** (текстуры/фото, часто отдельные ассеты под десктоп/мобайл): `getImage()` на
  каждый брейкпоинт + CSS-переменные на элементе + scoped `<style>` со сменой `background-image`
  под `@media (min-width:1024px)` → грузится **только нужный** вариант (не рендерить два `<Image>`
  и прятать один). Эталон — `TaijiTheory`/`TaijiPractice`/`TaijiHistory`. Под текстом поверх фото —
  токен-скрим, если контраст ink проседает ниже AA (`TaijiPractice`).
- **Меню↔шапка (десктоп):** `Menu.astro` сверху `pt-5` (20px), чтобы лого/крестик открытого меню
  встали ровно на лого/бургер шапки (`min-h-[94px] items-center`, лого `h-54` → top 20px). Мобайл —
  `pt-3` (контракт бургер↔меню). Менять только синхронно с обеими сторонами.

`site` для canonical/OG/sitemap берётся из `astro.config.mjs` (`site:`).

---

## 10. Верификация

1. **Node 22** перед любыми pnpm-командами (дефолт в шелле — v20):
   `nvm use 22` (или `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22` в
   неинтерактивном шелле).
2. Гейт перед «готово»:
   - **`pnpm check`** — `astro check`, должно быть **0 errors** (единственный TS/Astro-линт).
   - **`pnpm build`** — статическая сборка без ошибок.
3. **Playwright / браузер — ТОЛЬКО по явной просьбе** пользователя («проверь в браузере»,
   «сделай скриншот»). Сам не запускать; рендер пользователь смотрит сам.

---

## Открытые / отложенные

- **Домен — плейсхолдер.** `site: 'https://taiji-society.example'` в `astro.config.mjs` и
  `Sitemap:`/URL в `apps/web/public/robots.txt` — `.example`-заглушка. Заменить на реальный
  домен (нужно для canonical / OG / sitemap).
- **Слайдеры → `client:idle`** — кандидат на перевод с `client:load` (экономия на первом кадре),
  но нужна визуальная проверка на мигание под `<ClientRouter />`.
- **`gap-[14px]` / `gap-[10px]` в `Footer.astro`** — локальный разнобой с 4px-правилом; на главной
  оставлен, на новых страницах не повторять (раздел 2).
- **`lang="zh-Hans"`** на CJK-глифах (太极拳) пока нигде не проставлен в коде главной — добавлять
  на новых страницах (раздел 8).
- **`text-ink/65`** в About — пограничная приглушённость; новые блоки держать ≥ `/70`.
