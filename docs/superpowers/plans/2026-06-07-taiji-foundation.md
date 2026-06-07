# Taiji Front — Фундамент перед новыми страницами (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перед версткой остальных страниц убрать баги, свести цвета/типографику/навигацию к единому источнику, вынести глобальные компоненты (Header), закрыть базовый a11y/SEO-фундамент — чтобы новые страницы строились консистентно и без переноса дефектов.

**Architecture:** Astro 6 static SSG + React 19 острова + Tailwind v4 (токены в `src/styles/global.css`). Работаем **desktop-first** (`max-lg:` оверрайды, `lg`=1024px). Главная (`index.astro`) — **консервативно**: меняем только (а) визуально-нейтральные правки (баги, токенизация цветов без смены пикселя, токены, глобальный a11y-шелл), (б) согласованные видимые правки — контраст `opacity-50→70` в footer/hero/контактах. Размеры/раскладку блоков главной НЕ трогаем. Дизайн-систему и конвенции фиксируем как **стандарт для новых страниц**.

**Tech Stack:** Astro 6, React 19, Tailwind v4 (`@tailwindcss/vite`), GSAP+Lenis, Motion (`motion/react`), Astro Fonts API, `sharp`/`<Image>`, `@astrojs/sitemap` (добавляем).

**Решения пользователя (зафиксированы на брейншторме):**
- Код-ревью: тщательный мультиагентный аудит — **проведён** (51 подтверждённая находка, см. `docs/superpowers/specs` нет — находки в этом плане).
- Главная: **консервативно** (не трогаем пиксели/раскладку), НО контраст a11y AA правим и на главной.
- Header: **единый источник** — выносим `Header.astro`, Hero потребляет через слот (`variant="overlay"`), вывод байт-в-байт.
- Society h2 32px и Footer-баннер extrabold — **намеренные отдельные уровни** шкалы (фиксируем как `h2-compact` / `banner-heading`, главную не меняем).
- Проектный фундамент (SEO `<head>` + Open Graph + canonical + `og:locale`, `@astrojs/sitemap` + `robots.txt`, `404.astro`) — **включаем сейчас**.

---

## Глобальная верификация (используется во всех задачах)

Node 22 обязателен. Перед любой проверкой:

```sh
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh" >/dev/null; nvm use 22 >/dev/null
```

Гейт задачи (если не указано иное):

```sh
pnpm check            # astro check — TypeScript/Astro диагностика, должно быть 0 ошибок
pnpm build            # статическая сборка должна проходить
```

Визуальную проверку (Playwright MCP) запускаем ТОЛЬКО когда пользователь явно просит. Скриншоты-времянки из корня репо удаляем.

**Коммиты:** после каждой задачи (или логической под-группы). Сообщение на русском, префикс `fix:`/`feat:`/`refactor:`/`chore:`/`docs:`. Если на ветке `main` — сначала создать ветку `foundation/<area>`.

---

## File Structure (что создаём / меняем)

**Создаём:**
- `apps/web/src/config/nav.ts` — единый источник навигации (navCols, bigLinks, topNav).
- `apps/web/src/config/socials.ts` — единый источник соцсетей (id, alt, href).
- `apps/web/src/lib/icons.ts` — общие SVG-пути (ARROW_PATH, INFO_PATH).
- `apps/web/src/components/Header.astro` — глобальная шапка (variant overlay; задел под solid).
- `apps/web/src/pages/404.astro` — брендированная 404.
- `apps/web/public/robots.txt` — краулинг.
- `apps/web/src/components/SEO.astro` *(опц.)* или расширение `BaseLayout` пропсами — мета/OG.
- `docs/conventions.md` — living-doc по дизайн-системе и PC/Mobile (плюс синхронизация в `CLAUDE.md`).

**Меняем (ключевое):**
- `apps/web/src/styles/global.css` — токены цветов/теней, типошкала (`@layer components`), `:focus-visible`, `@utility container-block`, `.link-underline-group`.
- `apps/web/src/layouts/BaseLayout.astro` — `<main>`+skip-link, SEO-пропсы/OG, монтирование Header.
- `apps/web/src/components/Hero.astro` + `HeroSlider.tsx` — потребление Header через слот, баги reveal/видео/reduced-motion, тип слайда.
- `apps/web/src/components/Menu.astro`, `Footer.astro`, `Society.astro` — потребление nav/socials-конфигов.
- `apps/web/src/components/{About,News,Research,Contacts}.astro`, `ResearchSlider.tsx`, `SocietySlider.tsx`, `AboutInfo.tsx` — токены, DRY, a11y, перф.
- `apps/web/src/lib/{loader,menu,smooth,useSwipe}.ts` — баги жизненного цикла/ввода.
- `apps/web/astro.config.mjs` — `site`, интеграция `sitemap`.
- Каталоги `apps/web/src/assets/block{2,4,5,6}` → семантические имена.

---

# Фаза 0 — Подготовка

### Task 0: Ветка и зелёный базлайн

**Files:** —

- [ ] **Step 1: Ветка**

```sh
git checkout -b foundation/audit-fixes
```

- [ ] **Step 2: Зафиксировать зелёный старт**

```sh
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh" >/dev/null; nvm use 22 >/dev/null
pnpm install
pnpm check && pnpm build
```

Expected: `pnpm check` — 0 ошибок; `pnpm build` — успешная сборка в `apps/web/dist`. Это базлайн для сравнения после правок.

- [ ] **Step 3: Снять текущий dist как эталон диффа главной (для контроля «консервативности»)**

```sh
cp apps/web/dist/index.html /tmp/taiji-index-baseline.html
```

Будем сверять структуру/inline-стили главной после нейтральных правок: `diff <(...) ...` — допустимы только ожидаемые дельты.

---

# Фаза 1 — Баги (визуально нейтрально)

### Task 1.1: [HIGH] ResearchSlider — карточки не должны быть невидимы без JS

**Files:**
- Modify: `apps/web/src/components/ResearchSlider.tsx` (initial-состояние motion, ~строки 92–105, `initial` ~стр. 96)

**Проблема (аудит):** `initial={reduce ? false : { opacity: 0, y: 40 }}` запекается в статический HTML острова → в `dist/index.html` 5 карточек уходят с `style="opacity:0;transform:translateY(40px)"` без гейта `html.js`. Без JS/при медленной гидрации карточки навсегда невидимы. Эталон reveal-системы (`global.css:53-57`) прячет контент только под `html.js`.

- [ ] **Step 1:** Прочитать `ResearchSlider.tsx` целиком (понять, где `useInView`/`animate`).
- [ ] **Step 2:** Сделать стартовое состояние ВИДИМЫМ в SSR, а анимацию — пост-гидрационной. Вариант (минимальный): ввести флаг `mounted` (`useState(false)` + `useEffect(()=>setMounted(true),[])`) и для каждой карточки:

```tsx
// было: initial={reduce ? false : { opacity: 0, y: 40 }}
initial={false}
animate={mounted && !reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
// при mounted && !reduce && inView — проигрывать вход с начального { opacity:0, y:40 } через variants/animate,
// но статический рендер (mounted=false) ВСЕГДА даёт opacity:1.
```

Предпочтительная реализация: задать `variants={{hidden:{opacity:0,y:40},shown:{opacity:1,y:0}}}`, `initial={false}`, и `animate={shouldAnimate ? (inView?'shown':'hidden') : 'shown'}`, где `shouldAnimate = mounted && !reduce`. Так SSR-HTML и пользователи без JS видят `shown` (opacity:1).

- [ ] **Step 3 (verify сборку):** `pnpm build`, затем убедиться, что в статике нет скрытых карточек:

```sh
grep -o 'opacity:0[^"]*translateY(40px)' apps/web/dist/index.html | wc -l
```

Expected: `0`.

- [ ] **Step 4:** `pnpm check`. Expected: 0 ошибок.
- [ ] **Step 5:** Коммит `fix: ResearchSlider — карточки видимы без JS (reveal только после гидрации)`.

### Task 1.2: HeroSlider — не запускать видео при `prefers-reduced-motion`

**Files:**
- Modify: `apps/web/src/components/HeroSlider.tsx` (эффект `.play()`, ~строки 98–107)

**Проблема:** `active.play()` вызывается без проверки reduced-motion. Консистентно с `smooth.ts:18` нужно уважать настройку.

- [ ] **Step 1:** В эффекте воспроизведения перед `const p = active.play()` добавить ранний выход:

```tsx
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // постер остаётся статичным кадром
```

- [ ] **Step 2:** `pnpm check` + `pnpm build`.
- [ ] **Step 3:** Коммит `fix: hero-видео не автозапускается при prefers-reduced-motion`.

### Task 1.3: loader↔hero — «липкий» сигнал вместо one-shot события

**Files:**
- Modify: `apps/web/src/lib/loader.ts` (`signalReveal()`, ~стр. 112)
- Modify: `apps/web/src/components/HeroSlider.tsx` (reveal useEffect, ~строки 67–75)

**Проблема:** если остров смонтируется ПОСЛЕ раннего диспатча `taiji:loader-done`, одноразовый listener уже не сработает → hero скрыт навсегда. Латентно (лоудер сейчас отключён), но проект планирует его вернуть.

- [ ] **Step 1:** В `loader.ts` `signalReveal()` дополнительно выставлять флаг ДО/вместе с dispatch:

```ts
document.documentElement.dataset.loaderDone = "1";
document.dispatchEvent(new Event("taiji:loader-done"));
```

И сбрасывать флаг там же, где сбрасывается `revealSignaled` (в начале `run()`): `delete document.documentElement.dataset.loaderDone;`

- [ ] **Step 2:** В `HeroSlider.tsx` reveal-эффекте проверять оба условия на маунте:

```tsx
const html = document.documentElement;
if (!html.classList.contains("loading") || html.dataset.loaderDone === "1") {
  setRevealed(true);
  return;
}
const onDone = () => setRevealed(true);
document.addEventListener("taiji:loader-done", onDone, { once: true });
return () => document.removeEventListener("taiji:loader-done", onDone);
```

- [ ] **Step 3:** `pnpm check` + `pnpm build`.
- [ ] **Step 4:** Коммит `fix: липкий сигнал taiji:loader-done — hero не зависает скрытым при гонке гидрации`.

### Task 1.4: useSwipe — сброс жеста при мульти-тач

**Files:**
- Modify: `apps/web/src/lib/useSwipe.ts` (`onStart`, ~стр. 40)

**Проблема:** при втором пальце `onStart` делает `return` без сброса `tracking` → возможен ложный свайп (затрагивает все 3 слайдера).

- [ ] **Step 1:** Заменить ранний выход:

```ts
if (e.touches.length !== 1) { tracking = false; return; } // мульти-тач (pinch) отменяет текущий жест
```

- [ ] **Step 2:** `pnpm check` + `pnpm build`.
- [ ] **Step 3:** Коммит `fix: useSwipe — мульти-тач отменяет свайп, нет ложных переключений`.

### Task 1.5: reduced-motion для анимаций слайдеров

**Files:**
- Modify: `apps/web/src/components/SocietySlider.tsx` (inline `fade-in`, ~строки 44–47)
- Modify: `apps/web/src/components/HeroSlider.tsx` (cross-fade `transition-opacity`, gap) — опционально, см. ниже
- Modify: `apps/web/src/styles/global.css` (гейт keyframe `fade-in`)

**Проблема:** `SocietySlider` `fade-in` и hero cross-fade не уважают reduced-motion (gap-находка).

- [ ] **Step 1:** SocietySlider — заменить inline `style={{ animation: ... }}` на класс и гейтить:

```tsx
// import useReducedMotion из motion/react ИЛИ matchMedia
<div key={index} className={`flex flex-col gap-9 max-lg:gap-7 ${reduce ? "" : "animate-[fade-in_0.35s_ease_both]"}`}>
```

- [ ] **Step 2:** HeroSlider cross-fade (`transition-opacity duration-700`): при reduced-motion переключать слой мгновенно — добавить условный класс `reduce ? "transition-none" : "transition-opacity duration-700"`. (Низкий приоритет; если затягивает — задокументировать как отдельную мелкую задачу.)
- [ ] **Step 3:** `pnpm check` + `pnpm build`.
- [ ] **Step 4:** Коммит `fix: слайдеры уважают prefers-reduced-motion (fade/cross-fade)`.

### Task 1.6: HeroSlider — тип мобильного источника не должен допускать `<source src={undefined}>`

**Files:**
- Modify: `apps/web/src/components/HeroSlider.tsx` (тип `HeroSlide.bg`, ~строки 19–29; ветка выбора источника)
- Modify: `apps/web/src/components/Hero.astro` (формирование `bg`, ~строки 38–48)

**Проблема:** `webmMobile?`/`mp4Mobile?` независимо опциональны → при наличии только webm рендерится `<source src={undefined}>` (Safari-мобайл молча без видео).

- [ ] **Step 1:** Сгруппировать мобильные источники в один под-объект, чтобы они были «оба или ничего»:

```tsx
type HeroBg = {
  type: "video";
  webm: string; mp4: string; poster: string;
  mobile?: { webm: string; mp4: string; poster?: string };
};
```

- [ ] **Step 2:** Ветку выбора гейтить по `slide.bg.mobile`: `const m = isMobile && slide.bg.mobile ? slide.bg.mobile : null;` и рендерить `<source>` из `m ?? desktop`.
- [ ] **Step 3:** Обновить `Hero.astro` под новый shape (`mobile: { webm: heroVideoMobileWebm, mp4: heroVideoMobileMp4, poster: heroBg.src }`).
- [ ] **Step 4:** `pnpm check` + `pnpm build`.
- [ ] **Step 5:** Коммит `refactor: hero мобильные источники — взаимозависимый тип, нет битого <source>`.

### Task 1.7: ResearchSlider — точки/стрелки корректны при любом числе карточек

**Files:**
- Modify: `apps/web/src/components/ResearchSlider.tsx` (`activeDot`, рендер точек ~стр. 81/165; `atEnd`)

**Проблема:** точки захардкожены `[0,1,2]`, `atEnd` требует `maxScroll>0` → при `maxScroll===0` стрелка `next` «активна», но ничего не двигает. Врёт при другом числе карточек (критично для переиспользования на новых страницах).

- [ ] **Step 1:** Считать число дискретных позиций из прокрутки и выводить точки из него:

```tsx
const steps = maxScroll > 0 ? Math.round(maxScroll / step) + 1 : 1;
const activeDot = maxScroll > 0 ? Math.round(progress * (steps - 1)) : 0;
const atStart = offset >= 0;
const atEnd = maxScroll === 0 || offset <= -maxScroll;
// рендерить Array.from({length: steps}) вместо [0,1,2]; при steps<=1 точки не показывать
```

- [ ] **Step 2:** Стрелки дизейблить по `atStart`/`atEnd` (обе при `steps<=1`).
- [ ] **Step 3:** `pnpm check` + `pnpm build`; визуально (по запросу) — на главной 5 карточек, поведение точек не должно регрессировать.
- [ ] **Step 4:** Коммит `fix: ResearchSlider — точки/стрелки от числа карточек, не хардкод 3`.

### Task 1.8: menu.ts — первый фокус на крестик

**Files:**
- Modify: `apps/web/src/lib/menu.ts` (`open()`, ~стр. 39)

**Проблема:** фокус уходит на первый фокусируемый (логотип), а не на крестик, вопреки комментарию.

- [ ] **Step 1:**

```ts
overlay.querySelector<HTMLElement>("[data-menu-close]")?.focus();
```

- [ ] **Step 2:** `pnpm check` + `pnpm build`.
- [ ] **Step 3:** Коммит `fix: меню — первый фокус на кнопку закрытия`.

---

# Фаза 2 — Дизайн-система (токены + типошкала)

### Task 2.1: Токены цветов — свести бесхозные литералы

**Files:**
- Modify: `apps/web/src/styles/global.css` (`@theme`, строки 4–20)
- Modify: `apps/web/src/components/Contacts.astro` (`bg-[#eeece9]` ×3: стр. 58, 82, 117)
- Modify: `apps/web/src/components/Menu.astro` (`bg-[#e8e6e1]`, стр. 53)
- Modify: `apps/web/src/components/{About,News}.astro`, `ResearchSlider.tsx` (`bg-[#f7f5f4]` → `bg-surface`: About:89, News:66/107, ResearchSlider:108)
- Modify: 10 мест `border-black/15` → `border-border` (Contacts:52/76/100/131, About:86, News:62/104, Society:131, ResearchSlider:105, SocietySlider:88)

**Все правки визуально-нейтральны** (значения равны/почти равны исходным).

- [ ] **Step 1:** В `@theme` добавить:

```css
--color-field: #eeece9;            /* бежевые pill-поля (Contacts) */
--color-surface-overlay: #e8e6e1;  /* фон полноэкранного меню/оверлеев */
/* переопределить border как полупрозрачный ink, чтобы border-border == текущий border-black/15 */
--color-border: color-mix(in srgb, #0d1014 15%, transparent);
```

- [ ] **Step 2:** Заменить литералы на утилиты: `bg-[#eeece9]`→`bg-field`, `bg-[#e8e6e1]`→`bg-surface-overlay`, `bg-[#f7f5f4]`→`bg-surface`, `border-black/15`→`border-border`. (`border-black/5` и `border-black/10` оставить — это отдельные «тонкие» бордеры; задокументировать в конвенциях.)
- [ ] **Step 3 (verify):** `pnpm build`. Сверить главную с базлайном — допустимы только эквивалентные классы:

```sh
grep -c '#eeece9\|#e8e6e1\|#f7f5f4' apps/web/dist/index.html   # стало меньше/0 в инлайнах
```

- [ ] **Step 4:** `pnpm check`.
- [ ] **Step 5:** Коммит `refactor: цвета → токены (field/surface-overlay/border/surface), без смены пикселей`.

### Task 2.2: Токены теней

**Files:**
- Modify: `apps/web/src/styles/global.css` (`@theme`)
- Modify: `apps/web/src/components/SocietySlider.tsx` (стр. 136, 195), `AboutInfo.tsx` (стр. 101)

- [ ] **Step 1:** Добавить токены тени:

```css
--shadow-card: 0 20px 45px -15px color-mix(in srgb, var(--color-ink) 25%, transparent);
--shadow-popover: 0 14px 48px color-mix(in srgb, var(--color-ink) 16%, transparent);
```

- [ ] **Step 2:** Заменить `shadow-[0_20px_45px_-15px_rgba(13,16,20,0.25)]`→`shadow-card`, `shadow-[0_14px_48px_rgba(13,16,20,0.16)]`→`shadow-popover`.
- [ ] **Step 3:** `pnpm check` + `pnpm build`.
- [ ] **Step 4:** Коммит `refactor: тени → токены shadow-card/shadow-popover`.

### Task 2.3: Семантическая типошкала (стандарт для новых страниц)

**Files:**
- Modify: `apps/web/src/styles/global.css` (новый `@layer components` блок)
- Create/Modify: `docs/conventions.md` (Task 7.1) — таблица «роль → класс → desktop/mobile/вес»

**Цель:** зафиксировать классы-композиты с парами desktop/mobile + веса. Главную НЕ рефакторим под них (консервативно), кроме контраста. Society 32px и Footer extrabold — отдельные уровни (`h2-compact`, `banner-heading`).

- [ ] **Step 1:** В `global.css` добавить `@layer components` с классами (значения из аудита):

```css
@layer components {
  .text-h1        { @apply font-serif text-[60px] leading-[1.05] max-lg:text-[40px]; }
  .text-h2        { @apply font-display text-[40px] font-semibold leading-[1.1] max-lg:text-[30px]; }
  .text-h2-compact{ @apply font-display text-[32px] font-semibold leading-[1.1] max-lg:text-[26px]; }
  .text-banner    { @apply font-display text-[40px] font-extrabold leading-[1.1] max-lg:text-[22px]; }
  .text-h3        { @apply font-display text-2xl font-semibold leading-tight max-lg:text-[20px]; }
  .text-name      { @apply font-serif text-[39px] font-semibold leading-none max-lg:text-[28px]; }
  .text-body      { @apply font-sans text-base leading-relaxed max-lg:text-[15px]; }
  .text-eyebrow   { @apply font-display text-[12px] font-bold uppercase tracking-wide; }
  .text-caption   { @apply font-display text-sm font-semibold max-lg:text-[13px]; }
}
```

(Точные значения сверить с MagicPath-нодами при первом применении на новой странице; правка значений тут — единый источник.)

- [ ] **Step 2:** `pnpm build` (классы попадут в билд только при использовании — допустимо, что пока не используются; проверяем отсутствие ошибок компиляции `@apply`).
- [ ] **Step 3:** `pnpm check`.
- [ ] **Step 4:** Коммит `feat: семантическая типошкала (классы-композиты desktop/mobile) — стандарт новых страниц`.

### Task 2.4: Контраст a11y AA (включая главную — по решению)

**Files:**
- Modify: `apps/web/src/components/Footer.astro` (нижний бар `opacity-50` стр. 173; лейбл «Мессенджеры» стр. 112)
- Modify: `apps/web/src/components/Hero.astro` («МИССИЯ ОБЩЕСТВА» `text-white/50` стр. 104)
- Modify: `apps/web/src/components/Contacts.astro` (ссылка «Открыть на Яндекс.Картах» `text-ink/50` стр. 109)
- Modify: `apps/web/src/components/AboutInfo.tsx` («ПОДРОБНЕЕ» `text-ink/50` стр. 74)

**Цель:** поднять до ≥`/70` (white/70 на accent = 5.69:1; ink/70 на white проходит AA). Видимое, но минимальное изменение; применяем и на главной.

- [ ] **Step 1:** Footer: `opacity-50`→`opacity-70` (нижний бар, стр. 173) и лейбл «Мессенджеры и соц. сети» `opacity-50`→`opacity-70` (стр. 112). Декоративный иероглиф `opacity-50` (стр. 165, `alt=""`) НЕ трогать.
- [ ] **Step 2:** Hero: «МИССИЯ ОБЩЕСТВА» `text-white/50`→`text-white/75` (стр. 104). (Над видео — `/75` даёт запас; локальный скрим уже есть.)
- [ ] **Step 3:** Contacts ссылка карт: `text-ink/50`→`text-ink/70` (стр. 109). AboutInfo «ПОДРОБНЕЕ»: `text-ink/50`→`text-ink/70` (стр. 74).
- [ ] **Step 4 (доп. gap):** Contacts — пара `text-ink/50` на бежевом `bg-field` (#eeece9) ещё хуже (~2.6:1). Любой смысловой/интерактивный `text-ink/50` на `bg-field` поднять до `text-ink/70`+ или сразу `text-accent`.
- [ ] **Step 5:** `pnpm check` + `pnpm build`.
- [ ] **Step 6:** Коммит `fix(a11y): контраст AA — opacity-50→70 в footer/hero/контактах`.

---

# Фаза 3 — Глобальные компоненты / DRY

### Task 3.1: Единый nav-конфиг

**Files:**
- Create: `apps/web/src/config/nav.ts`
- Modify: `Menu.astro` (стр. 20–33), `Footer.astro` (стр. 13–19), `Hero.astro` (`navItems` стр. 22–28), `Society.astro` (tabs стр. 47–52)

**Канон (решено):** «Партнёры» (с ё), «Миссия и ценности» (ед. число), «Документы» — в колонке «Общество» **везде** (Menu его получает). Топ-уровень шапки оставляет свои лейблы для своей роли.

- [ ] **Step 1:** Создать `apps/web/src/config/nav.ts`:

```ts
export interface NavLink { label: string; href: string; }
export interface NavCol { title: string; href: string; links: NavLink[]; }

export const navCols: NavCol[] = [
  { title: "Тайцзицюань", href: "#", links: [
    { label: "История", href: "#" }, { label: "Теория", href: "#" },
    { label: "Практика", href: "#" }, { label: "Персоналии", href: "#" } ] },
  { title: "Общество", href: "#", links: [
    { label: "Миссия и ценности", href: "#" }, { label: "Команда", href: "#" },
    { label: "Партнёры", href: "#" }, { label: "Документы", href: "#" } ] },
  { title: "Исследования", href: "#", links: [
    { label: "Источники", href: "#" }, { label: "Публикации", href: "#" } ] },
];
export const bigLinks: NavLink[] = [
  { label: "Новости", href: "#" }, { label: "Мероприятия", href: "#" },
  { label: "Медиа-архив", href: "#" }, { label: "Контакты", href: "#" },
];
// Топ-меню шапки (роль/порядок отличаются от колонок — это нормально, единый источник лейблов сохранён)
export const topNav: NavLink[] = [
  { label: "Тайцзицюань", href: "#" }, { label: "Исследования", href: "#" },
  { label: "Об Обществе", href: "#" }, { label: "Мероприятия", href: "#" },
  { label: "Новости", href: "#" },
];
```

- [ ] **Step 2:** `Menu.astro`/`Footer.astro` — импортировать `navCols`/`bigLinks`, удалить локальные литералы. `Footer`-мобильные обёртки (используют `navCols[0]/[1]/[2]`) сохранить. Удалить ложный комментарий `Menu.astro:11` «Нав-структура 1:1 с Footer».
- [ ] **Step 3:** `Hero.astro` — `navItems` заменить на `topNav` (map по `.label`/`.href`). `Society.astro` tabs — привести написания к конфигу (если использует те же сущности; иначе оставить локально, но согласовать орфографию).
- [ ] **Step 4 (verify):** `pnpm build`. Ожидаемые дельты главной: в меню появляется «Документы» в колонке «Общество»; «Партнеры»→«Партнёры». Это согласованная унификация.
- [ ] **Step 5:** `pnpm check`.
- [ ] **Step 6:** Коммит `refactor: единый nav-конфиг (src/config/nav.ts) — убрано дублирование и расхождения`.

### Task 3.2: Контейнер-утилита

**Files:**
- Modify: `apps/web/src/styles/global.css` (`@utility` + CSS-переменные)
- Modify: `About.astro:47`, `Research.astro:44`, `News.astro:37`, `Society.astro:57`, `Contacts.astro:32`, `Footer.astro:30`, `Menu.astro:55`, `HeroSlider.tsx:178/218`

**Проблема:** `mx-auto w-full max-w-[1440px] px-11 max-lg:px-4` повторён ×8.

- [ ] **Step 1:** В `global.css`:

```css
:root { --content-max: 1440px; --gutter: 2.75rem; /* 44px */ }
@utility container-block { @apply mx-auto w-full max-w-[var(--content-max)] px-[var(--gutter)] max-lg:px-4; }
```

- [ ] **Step 2:** Заменить дословный паттерн на `container-block` в перечисленных местах. Где поверх навешаны `relative z-10`/доп. паддинги — сохранить их рядом с `container-block`. Для full-bleed (Menu/Hero, без `max-w`) — использовать только гаттер: можно ввести `@utility gutter-x { @apply px-[var(--gutter)] max-lg:px-4; }` и применить там.
- [ ] **Step 3:** `pnpm build` + сверка главной с базлайном (классы должны компилироваться в тот же CSS).
- [ ] **Step 4:** `pnpm check`.
- [ ] **Step 5:** Коммит `refactor: контейнер-утилита container-block + --content-max/--gutter`.

### Task 3.3: Вынести Header в единый источник (variant overlay)

**Files:**
- Create: `apps/web/src/components/Header.astro`
- Modify: `apps/web/src/components/Hero.astro` (`<header slot="header">…` строки 54–96 → `<Header slot="header" variant="overlay" />`)

**Цель:** перенести разметку шапки 1:1 в `Header.astro`, Hero рендерит её через слот. Вывод байт-в-байт (консервативно). Header читает `topNav` из nav-конфига. Логотип/эмблема — те же ассеты. Заложить проп `variant` (`overlay` сейчас; `solid` — задел, не реализуем, пока нет дизайна — YAGNI).

- [ ] **Step 1:** Создать `Header.astro` с `Props { variant?: "overlay" }`, перенести текущую разметку `<header>` из `Hero.astro` (логотип `logo-white.webp` обычным `<img>`, `topNav` из конфига, бургер с `data-menu-open` и всеми aria). Сохранить классы 1:1, включая `max-lg:` оверрайды и контракт геометрии бургера.
- [ ] **Step 2:** В `Hero.astro` импортировать `Header` и заменить инлайновый `<header slot="header">…</header>` на `<Header slot="header" variant="overlay" />`. Ассет-импорты, переехавшие в Header, убрать из Hero (если больше не нужны).
- [ ] **Step 3 (verify байт-в-байт):** `pnpm build`, затем сравнить блок шапки главной с базлайном:

```sh
diff <(grep -A2 'aria-label="Открыть меню"' /tmp/taiji-index-baseline.html) \
     <(grep -A2 'aria-label="Открыть меню"' apps/web/dist/index.html)
```

Expected: значимых отличий нет (кроме возможной перестановки атрибутов — проверить визуально по запросу).

- [ ] **Step 4:** `pnpm check`.
- [ ] **Step 5:** Коммит `refactor: Header.astro — единый источник шапки, Hero потребляет через слот`.

### Task 3.4: Единый socials-конфиг

**Files:**
- Create: `apps/web/src/config/socials.ts`
- Modify: `Menu.astro` (стр. 35–40, рендер 155–186), `Footer.astro` (стр. 21–26, рендер 115–127)

**Проблема:** список соцсетей продублирован (разные ассеты/габариты), риск рассинхрона.

- [ ] **Step 1:** Создать `socials.ts` с `{ id, alt, href }[]` (canonical порядок/alt). Ассеты (svg в Menu, png в Footer) подбирать в компоненте по `id` (карты `id→asset`), т.к. визуально это разные наборы — конфиг даёт единый источник состава/alt/href, рендер ассета остаётся локальным.
- [ ] **Step 2:** Обновить Menu/Footer на чтение состава из конфига.
- [ ] **Step 3:** `pnpm check` + `pnpm build`.
- [ ] **Step 4:** Коммит `refactor: единый socials-конфиг (состав/alt/href)`.

### Task 3.5: `.link-underline-group` вместо копипасты «Подробнее»

**Files:**
- Modify: `apps/web/src/styles/global.css` (новая утилита-вариант)
- Modify: `About.astro:14-15`, `News.astro:13-14`, `ResearchSlider.tsx:30-31`, `Contacts.astro:60/84/119`

**Проблема:** цепочка `after:...bg-accent/50...group-hover:after:scale-x-100` дублируется ×4; `.link-underline` (hover/currentColor) не подходит напрямую.

- [ ] **Step 1:** В `global.css` добавить вариант для group-hover + accent:

```css
.link-underline-group { position: relative; }
.link-underline-group::after { content:""; position:absolute; left:0; bottom:0; height:2px; width:100%;
  background-color: color-mix(in srgb, var(--color-accent) 50%, transparent);
  transform: scaleX(0); transform-origin: left; transition: transform .3s ease; }
.group:hover .link-underline-group::after { transform: scaleX(1); }
@media (prefers-reduced-motion: reduce){ .link-underline-group::after{ transition:none; } }
```

- [ ] **Step 2:** Заменить `moreClass`/`MORE_CLASS`/инлайн-цепочки на `link-underline-group` (+ сохранить `text-accent font-semibold` и т.п.).
- [ ] **Step 3:** `pnpm check` + `pnpm build` + сверка hover-подчёркивания (по запросу визуально).
- [ ] **Step 4:** Коммит `refactor: .link-underline-group — единый источник подчёркивания «Подробнее»`.

### Task 3.6: Модуль иконок (ARROW/INFO)

**Files:**
- Create: `apps/web/src/lib/icons.ts`
- Modify: `HeroSlider.tsx:33-34`, `ResearchSlider.tsx:17-18`, `SocietySlider.tsx:20-21` (ARROW), `About.astro:18-19`, `Society.astro:92` (INFO)

- [ ] **Step 1:** `icons.ts`:

```ts
export const ARROW_PATH = "M12.1716 6.77822l-5.364-5.36401 1.4142-1.41421 7.7782 7.77822-7.7782 7.7781-1.4142-1.4142 5.364-5.3639-12.1716 0 0-2 12.1716 0z";
export const INFO_PATH = "<точный d из About.astro:18-19 — скопировать дословно>";
```

- [ ] **Step 2:** Импортировать в острова/компоненты вместо локальных литералов.
- [ ] **Step 3:** `pnpm check` + `pnpm build`.
- [ ] **Step 4:** Коммит `refactor: SVG-пути иконок (ARROW/INFO) в src/lib/icons.ts`.

### Task 3.7: Переименовать каталоги ассетов в семантические

**Files:**
- Rename: `assets/block2→about`, `block4→news`, `block5→society`, `block6→contacts`
- Modify: импорты в `About.astro` (7–8), `News.astro` (8), `Society.astro` (10–17), `Contacts.astro` (3)

- [ ] **Step 1:** `git mv apps/web/src/assets/block2 apps/web/src/assets/about` (и т.д. для block4/5/6).
- [ ] **Step 2:** Обновить пути импортов в перечисленных компонентах.
- [ ] **Step 3:** `pnpm check` + `pnpm build` (Vite должен зарезолвить все ассеты).
- [ ] **Step 4:** Коммит `refactor: семантические имена каталогов ассетов (about/news/society/contacts)`.

---

# Фаза 4 — a11y-фундамент (глобально, визуально нейтрально)

### Task 4.1: `<main>` + skip-link

**Files:**
- Modify: `apps/web/src/layouts/BaseLayout.astro` (`<body>`, строки 50–54)

- [ ] **Step 1:** Добавить skip-link первым фокусируемым в `<body>` и обернуть `<slot/>` в `<main id="main">`:

```astro
<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:left-4 focus:top-4 focus:bg-white focus:text-ink focus:px-4 focus:py-2 focus:rounded">К основному содержимому</a>
<Menu />
<main id="main">
  <slot />
</main>
```

(Утилита `sr-only` есть в Tailwind по умолчанию.)

- [ ] **Step 2:** `pnpm check` + `pnpm build`. Проверить, что `<main id="main">` появился в `dist/index.html` ровно один раз.
- [ ] **Step 3:** Коммит `feat(a11y): <main> landmark + skip-link в BaseLayout`.

### Task 4.2: `role="banner"` для шапки

**Files:**
- Modify: `apps/web/src/components/Header.astro` (корневой `<header>`)

**Проблема:** `<header>` вложен в `<section>` острова → не получает `role=banner`. Самый дешёвый фикс — явный атрибут.

- [ ] **Step 1:** На корневой `<header>` Header'а добавить `role="banner"`.
- [ ] **Step 2:** `pnpm check` + `pnpm build`.
- [ ] **Step 3:** Коммит `fix(a11y): role=banner на глобальной шапке`.

### Task 4.3: Глобальный `:focus-visible`

**Files:**
- Modify: `apps/web/src/styles/global.css`

**Проблема:** нет видимого focus-ring; на тёмном hero/синих кнопках дефолтный плохо виден.

- [ ] **Step 1:** Добавить глобальное правило, видимое на обоих фонах:

```css
:where(a, button, [tabindex], input, select, textarea):focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 2px;
  box-shadow: 0 0 0 4px color-mix(in srgb, #ffffff 70%, transparent); /* halo для тёмных секций/видео */
}
```

(Проверить, что на белом фоне halo не мешает; при необходимости разнести контексты через `:where(.on-dark ...)`.)

- [ ] **Step 2:** `pnpm check` + `pnpm build`; tab по hero/CTA/меню (визуально по запросу) — ring заметен.
- [ ] **Step 3:** Коммит `feat(a11y): глобальный :focus-visible ring`.

### Task 4.4: `inert` фона при открытом меню

**Files:**
- Modify: `apps/web/src/lib/menu.ts` (`open()`/`close()`/`destroy()`)
- Modify: `apps/web/src/layouts/BaseLayout.astro` (целевой контейнер для inert — `<main>` + Header, всё кроме `#site-menu`)

**Проблема:** при `aria-modal=true` фон не изолирован (скринридер уходит под оверлей).

- [ ] **Step 1:** В `open()` ставить `inert` на основной контент (например на `<main id="main">` и на шапку/Header-контейнер), снимать в `close()`/`destroy()`. Учесть SPA: `astro:before-swap` уже зовёт `destroy()`.

```ts
const bg = document.getElementById("main");
// open: bg?.setAttribute("inert",""); (и на header-обёртку, если она вне main)
// close/destroy: bg?.removeAttribute("inert");
```

- [ ] **Step 2:** Проверить, что фокус-трап и Esc продолжают работать; `pnpm check` + `pnpm build`.
- [ ] **Step 3:** Коммит `fix(a11y): inert фона при открытом меню (изоляция модального диалога)`.

### Task 4.5: Слайдеры — `role=group`/`aria-roledescription`/`aria-live` + `aria-current`

**Files:**
- Modify: `HeroSlider.tsx`, `ResearchSlider.tsx`, `SocietySlider.tsx`

- [ ] **Step 1:** Обернуть карусель в `role="group" aria-roledescription="карусель" aria-label="…"`; сменяемую текстовую зону пометить `aria-live="polite"`.
- [ ] **Step 2:** `aria-current` на точках: вместо `aria-current={i===index}` (булево) использовать `aria-current={i===index ? "true" : undefined}`. Точкам-кнопкам дать `aria-label="Слайд N из M"`. В `ResearchSlider` точки-`span` сделать осмысленными или `aria-hidden` + полагаться на `aria-live`.
- [ ] **Step 3:** `pnpm check` + `pnpm build`.
- [ ] **Step 4:** Коммит `fix(a11y): слайдеры — carousel role/aria-live + корректный aria-current`.

### Task 4.6: `lang` на CJK-тексте

**Files:**
- Modify: `Society.astro` (alt/иероглифы, стр. ~83), любые `太极拳`/`传统太极拳学会`

- [ ] **Step 1:** Обернуть китайские глифы в элемент с `lang="zh-Hans"` (для `alt` — оставить как есть, но текстовые `太极拳` в разметке обернуть `<span lang="zh-Hans">`).
- [ ] **Step 2:** `pnpm check` + `pnpm build`.
- [ ] **Step 3:** Коммит `fix(a11y): lang=zh-Hans на китайских глифах`.

### Task 4.7: AboutInfo — снять лишний `role="dialog"`; имя персоны → `<h3>`

**Files:**
- Modify: `AboutInfo.tsx` (`role="dialog"`/`aria-label` ~стр. 94)
- Modify: `SocietySlider.tsx` (имя персоны `<p>`→`<h3>`, стр. 67–69)

- [ ] **Step 1:** AboutInfo — поповер немодальный: убрать `role="dialog"`+`aria-label` с `motion.div`, оставить disclosure-паттерн (`aria-expanded`+`aria-controls` на кнопке). Так не требуется фокус-трап.
- [ ] **Step 2:** SocietySlider — имя персоны `<p>`→`<h3>` (классы шрифт/размер сохранить, рендер не меняется).
- [ ] **Step 3:** `pnpm check` + `pnpm build`.
- [ ] **Step 4:** Коммит `fix(a11y): AboutInfo немодальный disclosure; имя персоны как <h3>`.

---

# Фаза 5 — Перф

### Task 5.1: Декоративные фоны → `<Image>`/webp

**Files:**
- Modify: `Research.astro` (импорт+`<img>` bg, стр. 10/38–43)
- Modify: `Society.astro` (кисть `bg-item-society.png`, стр. 17/102–107)

**Проблема:** `research/bg.png` 340 КБ (1310×1448) и `society` кисть 356 КБ (1449×585) отдаются plain `<img>`. Это градиентные текстуры (не флэт-иконки) → выигрывают от webp без артефактов. Экономия ≈ 600 КБ.

- [ ] **Step 1:** Research bg → `getImage({ src: bg, width: 1310, format: "webp" })` и подставить `.src`, либо `<Image>` с `loading="lazy"` (ниже первого экрана), `aria-hidden`, те же позиционные классы.
- [ ] **Step 2:** Society кисть → паттерн как у person-фото в этом же файле (`getImage`+webp), `width: 1068` (2×534). `cali-symbol-5block.png` (мелкая флэт-арт, 82 КБ) — НЕ трогать (корректно plain `<img>`).
- [ ] **Step 3:** `pnpm build`; убедиться, что в `dist/_astro` появились webp-варианты, исходные PNG не уходят в инлайн.
- [ ] **Step 4:** `pnpm check`.
- [ ] **Step 5:** Коммит `perf: декоративные фоны research/society → webp (~−600КБ)`.

### Task 5.2: Hero-постер — responsive + preload (LCP)

**Files:**
- Modify: `Hero.astro` (постер), `HeroSlider.tsx` (атрибут poster), `BaseLayout.astro` (preload в `<head>` через slot/проп)

**Проблема:** `hero-bg.webp` 4K (218 КБ) — фактический LCP, отдаётся одним размером на все экраны, без preload.

- [ ] **Step 1:** Сгенерировать постер в размерах (768/1440/2560 webp) через `getImage`, выбирать по `isMobile`.
- [ ] **Step 2:** Добавить в `<head>` BaseLayout `<link rel="preload" as="image" href={posterSrc} fetchpriority="high">` (передать выбранный src пропом/слотом из страницы с Hero, чтобы не грузить на страницах без него).
- [ ] **Step 3:** `pnpm build`; проверить наличие preload в `dist/index.html`.
- [ ] **Step 4:** `pnpm check`.
- [ ] **Step 5:** Коммит `perf: hero-постер responsive + preload (LCP)`.

### Task 5.3: News featured `<Image>` — widths/sizes

**Files:**
- Modify: `News.astro` (стр. 83–87)

- [ ] **Step 1:** Добавить `widths={[221,442]} sizes="221px"` (по образцу `About.astro` history-card).
- [ ] **Step 2:** `pnpm check` + `pnpm build`.
- [ ] **Step 3:** Коммит `perf: News featured <Image> widths/sizes`.

### Task 5.4: Пауза hero-видео при уходе из вьюпорта

**Files:**
- Modify: `HeroSlider.tsx` (IntersectionObserver на `rootRef`)

**Проблема:** активное видео декодится даже когда hero полностью перекрыт скроллом (батарея/CPU).

- [ ] **Step 1:** Добавить IO на корневую `section`: при `intersectionRatio→0` паузить активное видео, при возврате — `play()` только если `revealed` и не reduced-motion. Чистить наблюдатель в cleanup эффекта.
- [ ] **Step 2:** `pnpm check` + `pnpm build`.
- [ ] **Step 3:** Коммит `perf: пауза hero-видео когда блок вне вьюпорта`.

### Task 5.5: `client:idle` для не-Hero островов (с проверкой в prod)

**Files:**
- Modify: `About.astro:64` (AboutInfo), `Research.astro:63` (ResearchSlider), `Society.astro:132` (SocietySlider)

**Проблема:** 4 острова `client:load`, в т.ч. ниже первого экрана + 122КБ motion-чанк в стартовом бандле. Hero оставить `client:load`.

- [ ] **Step 1:** AboutInfo → `client:visible` или `client:idle` (поповер не мигает). ResearchSlider/SocietySlider → `client:idle` (без зависимости от viewport-пересечения → без мигания ClientRouter; НЕ `client:visible`).
- [ ] **Step 2 (обязательная проверка):** `pnpm build && pnpm preview` — в prod проверить, что слайдеры НЕ мигают/не «появляются-исчезают» при загрузке и SPA-навигации. Если мигают — откатить на `client:load` и задокументировать.
- [ ] **Step 3:** `pnpm check`.
- [ ] **Step 4:** Коммит `perf: не-Hero острова client:idle (TBT), Hero остаётся client:load` (или revert с пометкой).

### Task 5.6: Hero — отдельные объекты слайдов + ленивая загрузка видео

**Files:**
- Modify: `Hero.astro` (`slides`, стр. 49), `HeroSlider.tsx` (preload по близости к index)

**Проблема:** 3 ссылки на один `baseSlide` (алиасинг при будущих правках); все 3 `<video>` с `preload="auto"` одновременно.

- [ ] **Step 1:** `slides = [{...baseSlide}, {...baseSlide}, {...baseSlide}]` (отдельные объекты).
- [ ] **Step 2:** В HeroSlider грузить/`preload="auto"` только активный и соседний слайды; остальным `preload="none"`. Сохранить existing гейтинг desktop/mobile.
- [ ] **Step 3:** `pnpm check` + `pnpm build` + prod-проверка плавности cross-fade (по запросу).
- [ ] **Step 4:** Коммит `perf: hero — отдельные слайды + ленивый preload видео`.

---

# Фаза 6 — Проектный фундамент (SEO / sitemap / 404)

### Task 6.1: SEO `<head>` — пропсы + Open Graph + canonical + locale

**Files:**
- Modify: `apps/web/src/layouts/BaseLayout.astro` (`<head>`, Props)
- Modify: `apps/web/src/pages/index.astro` (передать осмысленные title/description)

**Проблема:** статичные `title='Taiji'`/`description='Информационный портал.'` на весь сайт; нет OG/Twitter/canonical/`og:locale`.

- [ ] **Step 1:** Расширить `Props` BaseLayout: `title`, `description`, `ogImage?`, `noindex?`. Дефолты — брендовые на русском.
- [ ] **Step 2:** В `<head>` добавить:

```astro
<link rel="canonical" href={new URL(Astro.url.pathname, Astro.site)} />
<meta property="og:type" content="website" />
<meta property="og:locale" content="ru_RU" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={new URL(Astro.url.pathname, Astro.site)} />
{ogImage && <meta property="og:image" content={new URL(ogImage, Astro.site)} />}
<meta name="twitter:card" content="summary_large_image" />
```

(Требует `site` в `astro.config.mjs` — см. Task 6.2.)

- [ ] **Step 3:** В `index.astro` передать `title="Общество изучения традиционного тайцзицюань"` и осмысленный `description`.
- [ ] **Step 4:** `pnpm check` + `pnpm build`; проверить мета в `dist/index.html`.
- [ ] **Step 5:** Коммит `feat(seo): BaseLayout — title/description пропсы + Open Graph + canonical + og:locale`.

### Task 6.2: `@astrojs/sitemap` + `robots.txt`

**Files:**
- Modify: `apps/web/astro.config.mjs` (`site`, `integrations`)
- Create: `apps/web/public/robots.txt`

- [ ] **Step 1:** Установить интеграцию:

```sh
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh" >/dev/null; nvm use 22 >/dev/null
pnpm -C apps/web exec astro add sitemap --yes
```

- [ ] **Step 2:** Задать `site: "https://<домен>"` в `astro.config.mjs` (уточнить домен у пользователя; временно плейсхолдер + TODO).
- [ ] **Step 3:** `public/robots.txt`:

```
User-agent: *
Allow: /
Sitemap: https://<домен>/sitemap-index.xml
```

- [ ] **Step 4:** `pnpm build`; проверить генерацию `sitemap-*.xml` в `dist`.
- [ ] **Step 5:** Коммит `feat(seo): @astrojs/sitemap + robots.txt + site`.

### Task 6.3: Брендированная `404.astro`

**Files:**
- Create: `apps/web/src/pages/404.astro`

- [ ] **Step 1:** Страница на `BaseLayout` (тот же шелл/шрифты/Header/Footer): заголовок «Страница не найдена», ссылка на главную, `noindex`.
- [ ] **Step 2:** `pnpm build`; проверить `dist/404.html`.
- [ ] **Step 3:** `pnpm check`.
- [ ] **Step 4:** Коммит `feat: брендированная 404.astro`.

---

# Фаза 7 — Конвенции PC/Mobile (living-doc)

### Task 7.1: `docs/conventions.md` + синхронизация CLAUDE.md

**Files:**
- Create: `docs/conventions.md`
- Modify: `CLAUDE.md` (короткие ссылки на конвенции, если уместно)

- [ ] **Step 1:** Зафиксировать в `docs/conventions.md`:
  - **Контейнер/сетка:** `container-block` (1352px контента, гаттер 44/16px), `--content-max`/`--gutter`; full-bleed = `overflow-x-clip` на секции.
  - **Desktop-first / адаптив:** базовые классы — десктоп; мобильные оверрайды через `max-lg:` (lg=1024). Правило 4px-сетки: **если значение есть на Tailwind-шкале — писать шкалой** (`gap-10`, не `gap-[40px]`); произвольные px — только для реально нестандартных величин.
  - **Токены:** ink/surface/surface-sunken/surface-overlay/field/border/accent/accent-soft; тени `shadow-card`/`shadow-popover`; правило «новый цвет — только через токен».
  - **Типошкала:** таблица роль→класс→desktop/mobile/вес (из Task 2.3), включая отдельные уровни `h2-compact` (Society) и `banner-heading` (Footer) — намеренные.
  - **Навигация/соцсети:** единый источник `src/config/nav.ts`, `src/config/socials.ts`.
  - **Ассеты:** фото→`<Image>`+widths/sizes; флэт-бренд/иконки→plain `<img>`; крупные текстуры→`<Image>`/webp; SVG→`?url`/инлайн для `currentColor`/анимации; каталоги — семантические имена.
  - **Острова:** слайдеры `client:load`/`client:idle` (не `client:visible`); reduced-motion уважать во всех JS-анимациях; reveal/скрытие — только под `html.js`.
  - **a11y-чеклист новой страницы:** один `<main>`, корректная иерархия h1→h2→h3, `:focus-visible`, alt/`aria`, контраст AA (≥4.5:1 / ≥3:1 крупный), `lang` на иноязычных глифах.
  - **Header/Footer/Menu:** глобальные; новая страница использует `BaseLayout` (Menu уже в шелле) + `<Header>` + `<Footer>`.
- [ ] **Step 2:** Коммит `docs: конвенции PC/Mobile + дизайн-система (living-doc)`.

---

## Self-Review (выполнено при написании)

- **Покрытие решений:** баги (Фаза 1) ✓; цвета→токены + типошкала (Фаза 2, пункт «нет разброса цветов» + «моб. h2») ✓; глобальные компоненты Header/nav/Footer/Menu (Фаза 3) ✓; контраст на главной (2.4, по решению) ✓; Society/Footer как отдельные уровни (2.3, по решению) ✓; SEO/sitemap/404 (Фаза 6, по решению) ✓; конвенции PC/Mobile (Фаза 7) ✓.
- **Консервативность главной:** видимые правки главной ограничены контрастом (2.4) и согласованной унификацией nav-лейблов (3.1). Остальное визуально-нейтрально; контроль — сверка `dist/index.html` с базлайном (Task 0 Step 3).
- **Зависимости:** Task 6.1 (canonical/OG url) зависит от `site` (Task 6.2) — выполнять 6.2 перед/вместе с 6.1. Task 4.2/4.4 зависят от Header (3.3) и `<main>` (4.1). Task 2.3 типошкала — стандарт, не применяется к главной.
- **Плейсхолдеры:** домен в `site`/`robots.txt` (6.2) и точный `d` для `INFO_PATH` (3.6) — отмечены как «уточнить/скопировать дословно при исполнении», не выдуманы.

---

## Открытые вопросы к пользователю (не блокируют старт)
1. **Домен** для `site`/canonical/sitemap/robots (Task 6.2) — какой? До ответа ставлю TODO-плейсхолдер.
2. Реальные `href` навигации/соцсетей — пока `#` (CMS позже); единый конфиг готов их принять.
