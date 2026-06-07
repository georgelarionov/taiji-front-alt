# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Prerequisite: Node 22

The default `node` in this shell is **v20**, but Astro 6 / `create astro` require **Node ≥ 22.12** and will hard-fail on v20 with "Node.js is out-of-date and unsupported". An `.nvmrc` (= 22) is committed. Switch before running anything:

```sh
nvm use 22
```

For non-interactive shells where the nvm function isn't loaded, prefix commands with:

```sh
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh" >/dev/null; nvm use 22 >/dev/null
```

`pnpm` (9.15.4) lives in the v20 bin but runs via `env node`, so it executes correctly under v22 once switched.

## Commands

All run from the repo root (pnpm workspace; the web app's package name is `web`):

- `pnpm install` — install all workspace deps
- `pnpm dev` — Astro dev server for `apps/web` at http://localhost:4321 (HMR)
- `pnpm build` — static build → `apps/web/dist`
- `pnpm preview` — serve the production build
- `pnpm check` — `astro check` (TypeScript/Astro diagnostics; this is the only "test/lint" gate currently)

Scoped operations on the web app:

- `pnpm -C apps/web add <pkg>` / `pnpm -C apps/web add -D <pkg>` — add a dependency
- `pnpm -C apps/web exec astro add <integration> --yes` — add an Astro integration (auto-updates `astro.config.mjs` + `tsconfig.json`)

There is **no unit-test runner** wired up yet.

## Architecture

**Monorepo** (pnpm workspaces: `apps/*`, `packages/*`). The site is an information/brand portal. Priorities driving the stack choice: speed, cross-browser stability, and rich animations. Next.js was deliberately rejected.

Current state — **frontend-first, CMS added later**. The main page is **fully assembled** (see Page composition); current phase is **polishing**.
- `apps/web` — Astro 6, **static output** (deploys as a static upload, no SSR), React 19 islands, Tailwind 4, `sharp` (required for `<Image>` optimization).
- Planned (not yet created): `apps/cms` (Payload CMS self-hosted + SQLite) and `packages/types` (Payload-generated types shared into the web app). The web app will consume Payload over REST/GraphQL; the backend choice does not affect the frontend.

### apps/web key patterns

- **Islands:** components are static HTML by default (zero JS). React interactivity is opt-in per component via `client:*` directives. Keep JS minimal — this is the performance story. **Use `client:load` for the interactive sliders, NOT `client:visible`** — `client:visible` (hydrate-on-scroll) flickered/“appeared and disappeared” under `<ClientRouter />` (see Gotchas).
- **Tailwind 4** is wired as a **Vite plugin** (`@tailwindcss/vite` in `astro.config.mjs` → `vite.plugins`), *not* the legacy `@astrojs/tailwind` integration. There is **no `tailwind.config.js`**: design tokens live in `src/styles/global.css`. Colors are in a plain `@theme { … }` block — a light-first palette: `--color-ink` (#0d1014, dark base/text, *not* pure black), `--color-surface`/`--color-surface-sunken` (off-white card/block backgrounds), `--color-border`, `--color-accent` (#023c97) + `--color-accent-soft`. Font tokens are in a separate **`@theme inline`** block (see Fonts below). Utilities only emit when used in markup — a token can exist without its `bg-`/`font-` class appearing in the build until something references it.
- **Fonts** are managed by the **Astro 6 Fonts API** (`fonts: [...]` in `astro.config.mjs`), *not* hand-written `@font-face`. Local woff2 live in `src/assets/fonts/` (**not `public/`** — that duplicates them in the build); Inter is pulled+self-hosted via the `fontsource()` provider (latin+cyrillic). `BaseLayout.astro` renders `<Font cssVariable=… />` in `<head>` for each family, and `@theme inline` in `global.css` maps them to Tailwind: `font-sans`→Inter (body/UI), `font-serif`→Cormorant Garamond (headings/hero/quotes), `font-display`→Manrope (subheads/buttons/eyebrows). To add a weight/style, add a variant in the config (local) or a weight in the provider options (fontsource) — never write raw `@font-face`.
- **Global scrollbar** styling lives in `global.css`: thin accent-blue thumb on a transparent track (`scrollbar-width/-color` for Firefox; `::-webkit-scrollbar*` for Blink/WebKit). Uses the `--color-accent` token, no hardcoded color.
- **`BaseLayout.astro`** is the shared shell every page should use. It imports `global.css`, mounts `<ClientRouter />` (View Transitions), renders the `<Font/>` tags, runs an inline `is:inline` `<head>` script (sets `html.js`, and — for the intro splash — `html.loading`; see Loader), mounts `<Loader/>` as the first `<body>` child, and loads the runtimes via `<script>import "../lib/loader"</script>` and `<script>import "../lib/smooth"</script>`.

### Animation runtime (the critical cross-file contract)

`src/lib/smooth.ts` owns the client-side animation runtime: **Lenis** smooth scroll + **GSAP/ScrollTrigger** reveals.

`<ClientRouter />` does SPA-style navigation where `<script>`s are **not re-executed** on page change. To prevent animations from "falling off" after navigation, `smooth.ts` registers listeners at module top level:
- `astro:page-load` → (re)initialize Lenis + ScrollTrigger (this event fires on the **first** load *and* every subsequent navigation)
- `astro:before-swap` → tear everything down

**Any new JS-driven animation must follow this same lifecycle** (init on `astro:page-load`, clean up on `astro:before-swap`) — use these events instead of `DOMContentLoaded`, or it will break on navigation.

Tooling per layer: **Motion** (`motion/react`) for component-level animation *inside React islands*; **GSAP + Lenis** for scroll/runtime; plain CSS for simple effects.

### Reveal-on-scroll mechanism

Add `data-reveal` to any element and `smooth.ts` animates it in via GSAP ScrollTrigger. The hidden initial state is CSS in `global.css`, scoped to `html.js` (set by the inline head script) so **content stays visible without JS**, and the whole effect is disabled under `prefers-reduced-motion`.

### Loader (intro splash)

A decorative full-screen brand splash shown **once per session** on first load. Files: `src/components/Loader.astro` (markup), `src/lib/loader.ts` (GSAP timeline + lifecycle), assets in `src/assets/loader/`, gate CSS in `global.css`, mounted in `BaseLayout`.

- **Visibility gate (FOUC-safe):** the inline `is:inline` `<head>` script adds `html.loading` **before paint**, only when `sessionStorage 'taiji:loaded'` is unset **and** not `prefers-reduced-motion`. CSS: `[data-loader]{display:none}` → `html.loading [data-loader]{display:block}`, plus `html.loading{overflow:hidden}` (scroll lock incl. Lenis) and `html.loading [data-loader-fade]{opacity:0}` (hide animated elements until GSAP runs). Net: no content flash on first load; **no replay** on SPA navigation (the `<head>` script doesn’t re-run under `<ClientRouter />`), in-session reload, no-JS, or reduced-motion. `loader.ts` sets the flag in `finish()`. *(A `TEST:` marker in BaseLayout’s inline script can temporarily disable the per-session gate so the loader shows every load — re-comment to restore.)*
- **Lifecycle:** same `astro:page-load` / `astro:before-swap` contract as `smooth.ts`, **except** the timeline start is deferred via `requestIdleCallback` (timeout 500ms, `setTimeout` fallback) so it doesn’t fight first-load hydration/decode for the main thread (otherwise the opening frames stutter — see Gotchas). `cleanup()` cancels the pending start and clears `html.loading` if navigation interrupts mid-loader.
- **Animation (GSAP, ~5s; constants at top of `loader.ts`):** fade-in of `[data-loader-fade]`; the calligraphic ring is “drawn” via an SVG `<mask>` whose stroked circle animates `stroke-dashoffset` (the ring path `d` is extracted from the asset svg imported with `?raw` — a filled line can’t be drawn by dashoffset directly); then exit — the bg layer slides up `-100%` while the `[data-loader-content]` layer slides a touch more + fades (`CONTENT_LIFT`) for a subtle parallax.
- **Background:** `loader-bg.png` is a soft, pre-baked frosted texture served via Astro `<Image>` (photo path; compresses to a few KB webp). An earlier live `backdrop-blur` was dropped — see Gotchas.

### Loader ↔ Hero reveal (cross-file contract)

The hero’s intro (text stagger **and** background video start) is gated on the loader leaving — **not a fixed timer**. The decoupling is a single custom event so each side can change independently.

- **Signal:** `loader.ts` dispatches `document` event `taiji:loader-done`. It’s sent **early** — `REVEAL_LEAD` seconds (currently 0.8, must be ≤ `EXIT`) *before* the exit completes, via `tl.call(...)` during the EXIT phase. So the hero comes alive **from under the still-departing panel** → seamless hand-off, no dead frame of a static hero. Sending it in `onComplete` instead (after full exit) reintroduces the dead frame. The dispatch is idempotent (`signalReveal()` + `revealSignaled` flag, reset at the top of `run()`); the reduced-motion / no-loader branches still fire it via `finish()`.
- **Receiver:** `HeroSlider.tsx` holds a `revealed` state. On mount: if `html.loading` is **absent** (in-session reload, SPA nav, reduced-motion, or the loader already left) → reveal immediately; else add a one-shot `taiji:loader-done` listener. Reveal does two things: adds the `.hero-revealed` class to the text wrapper (triggers the `[data-rise]` animation) and lifts the `if (!revealed) return` guard so the active slide’s video `.play()`s.
- **Text stagger (`Hero.astro` `<style>`):** `[data-rise]` elements are hidden via `html.js [data-rise]{opacity:0}` and animate (`hero-rise`, 1.6s soft ease-out) **only** under `.hero-revealed`. Per-step `animation-delay` 0.5/0.68/0.86/1.04s — the 0.5s base offset makes text trail the video slightly; the 0.18s step is the eyebrow→title→subtitle→CTA wave. `key={index}` on the wrapper remounts it on slide change so the wave replays. `prefers-reduced-motion` resets opacity to 1 (instant, no animation).
- **Tuning:** change *when* the hero reveals via the loader timeline (`HOLD_UNTIL`/`EXIT`/`REVEAL_LEAD` in `loader.ts`), not a magic number in the hero. Change the text’s extra lag via the `animation-delay`s in `Hero.astro`.

### Hero parallax overlap (cross-file contract)

The hero stays a **stationary bottom layer**; everything below scrolls up *over* it while the hero **darkens** to ~50%. The hero itself never moves — this is an overlap of a fixed background, not a slow parallax shift.

- **Overlap (pure CSS, no JS):** `HeroSlider.tsx`’s root `<section>` is `sticky top-0 z-0` (height stays `h-svh min-h-[640px]`) — sticky reserves its 100svh slot in flow and pins the hero to the viewport top. In `index.astro` everything after `<Hero />` (`About`…`Footer`) is wrapped in `<div class="relative z-10 bg-white">` — a higher layer that slides over the pinned hero (`bg-white` guards against a sliver of hero showing through any gap). **Sticky, not `position:fixed` or a ScrollTrigger pin:** sticky reserves its own flow slot (no manual spacer) and adds no pin-spacers (those misbehave with Lenis); Lenis uses native scroll, so sticky just works.
- **Darken (GSAP scrub in `smooth.ts`):** a `[data-hero-darken]` layer inside the hero (`absolute inset-0 z-30 bg-ink opacity-0` — z-30 sits above bg `-z-20`, scrim `-z-10`, and the default-z flex content, so it darkens the **whole** block). `setupHeroParallax()` runs `gsap.fromTo` opacity `0 → 0.5` on a scrubbed ScrollTrigger (`trigger: hero`, `start "top top"`, `end "bottom top"`) → over the first screen of scroll the hero reaches ~50% darkness exactly as the content finishes covering it. start/end map off the hero’s **flow slot** (sticky reserves it), not its pinned position, so the 0→100svh mapping is correct. No ScrollTrigger pin — the overlap is the CSS sticky.
- **Lifecycle:** `setupHeroParallax()` is called in `smooth.ts` `init()` (after `startSmoothScroll()`, before `ScrollTrigger.refresh()`); `destroy()` already kills all ScrollTriggers, so SPA nav re-creates it cleanly — same contract as the rest of the runtime. Under `prefers-reduced-motion` `init()` returns early → no scrub, the layer stays `opacity-0` (no darkening); sticky is pure CSS so the layout stays — correct degradation.

## Page composition (built — now polishing)

The whole main page is assembled in `apps/web/src/pages/index.astro` as one component per design block, in order. Each block lives in `apps/web/src/components/` with assets under `src/assets/<block>/`:

| Block | Component | Notes |
|---|---|---|
| `1-block` | `Hero.astro` + `HeroSlider.tsx` | **full-bleed**, 100svh, **slider** (cross-fade bg video/image + per-slide text & CTA, pagination dots, arrows 50% at ends); static menu + bottom strip passed in via named slots; bg video `hero-video.webm`/`.mp4` + `hero-bg.webp` poster. Reveal gated on loader (see Loader ↔ Hero reveal); **sticky parallax base** — content below overlaps + darkens it on scroll (see Hero parallax overlap) |
| `2-block` | `About.astro` | «О тайцзицюань» — 2×2 bordered cards |
| `3-block` | `Research.astro` + `ResearchSlider.tsx` | «Исследования» — full-width `surface-sunken` bg; horizontal card slider bleeding off the right edge |
| `4-block` | `News.astro` | «Новости» — 1 big + 2 stacked cards + full-width CTA |
| `5-block` | `Society.astro` + `SocietySlider.tsx` | «Об Обществе» — surface left panel + white right content-swap slider |
| `6-block` | `Contacts.astro` | «Контакты» — 3 cards with `#eeece9` field pills |
| `footer` | `Footer.astro` | **full-width accent bg**, nav columns, socials, centered banner (ornament + logo + calligraphy) |

## Conventions (apply these when polishing/extending)

> **Living-doc:** `docs/conventions.md` — детальные конвенции дизайн-системы и подхода PC/Mobile (контейнер/сетка, цветовые токены, типошкала, ассеты, доступность, SEO-шелл, верификация) для сборки **новых** страниц. Этот раздел — краткая выжимка; полный свод и «Открытые/отложенные» см. там.

- **Container:** standard block = `<section …><div class="mx-auto w-full max-w-[1440px] px-11">…</div></section>` → 1352px content with 44px gutters at ≥1440. **Full-bleed** blocks (Hero, Footer, Research bg) put the bg/section at full width and keep content in that container; Hero’s content has no max-width cap.
- **Tokens first:** map design values to tokens (`font-serif`=Cormorant, `font-display`=Manrope, `font-sans`=Inter; `--color-ink`/`accent`/`accent-soft`/`surface`/`surface-sunken`). Arbitrary values only for one-off design specifics (e.g. field pill `bg-[#eeece9]` in Contacts — a candidate to tokenize as `--color-field`).
- **Assets — how to serve what:**
  - **Photos** (hero, future imagery) → Astro `<Image>` with `widths`+`sizes` (responsive webp; `sharp` does the work). Downscaling a hi-res source looks great.
  - **Flat brand/logo/icon rasters** (exported from the design source) → **plain `<img src={import.src}>`, NOT `<Image>`** — `<Image>`’s webp over-compressed small flat art into visible artifacts. Plain `<img>` ships the original (just fingerprinted). The header logo is one such asset (see Responsive → Hero).
  - **SVG** → `import x from "…/x.svg?url"` then `<img src={x}>` (control intensity with CSS `opacity`). Inline only for tiny icons needing `currentColor`, or when the path must be animated — e.g. a “drawn” stroke/mask: import the svg with `?raw` and extract its `d` to inline it (see Loader).
  - Real assets the user drops in `assets-dev/` get copied into `src/assets/<block>/`.
- **Sliders** are React islands (`.tsx`), `client:load`. `ResearchSlider` = horizontal `translateX` track on `overflow-x-clip` section, full-bleed right, `RIGHT_GAP=44` so the last card stops 44px from the screen edge. `SocietySlider` = content-swap with `fade-in` keyframe (in `global.css`). `HeroSlider` = stacked bg layers cross-faded via `transition-opacity` (only the active slide’s `<video>` plays; others paused), text+CTA swapped per slide, **not looped** (end arrows drop to 50% + `disabled`); static chrome (header/bottom strip) is passed from `Hero.astro` via **named slots** → island props (`header`/`footer`), keeping it zero-JS. The carousel **arrow** path is the same constant across all sliders; dots = active `w-[65px]` / inactive `w-6 opacity-35`.
- **Responsive (адаптив):** **desktop-first** — existing desktop classes stay the base; mobile overrides are added with the **`max-lg:`** variant (breakpoint `lg` = 1024px, so mobile = `<1024px`; tablets get the mobile layout). **All mobile spacing/sizing follows a 4px grid** (values are multiples of 4: 4/8/12/16/20/24…). Design source = the `*-mobile` **MagicPath** components (390px artboard; inspect exact values via `npx -y magicpath-ai inspect <generatedName> -o json`, don't eyeball). Going block by block. The **Hero** is the reference implementation: desktop `<ul>` nav hidden via `max-lg:hidden` (only the burger remains → it opens the existing full-screen menu), mission strip dropped on mobile, type scaled down, CTA full-width. **Header logo:** a single full-lockup WebP (`src/assets/hero/logo-white.webp`, ratio ~6.72 — the ☯-ornament icon + «ОБЩЕСТВО ИЗУЧЕНИЯ…» wordmark baked into one white image; plain `<img>`, *not* `<Image>`). It replaced the old icon+divider+text composition. Desktop `h-[54px] w-auto`; on mobile **fixed `max-lg:h-10`** (40px, `w-auto` — *not* fluid). **Burger ↔ menu-close contract:** Hero's burger (open state) and `Menu.astro`'s close-X (close state) must share identical mobile header geometry — `px-4`, `pt-3`, and a `max-lg:h-11 max-lg:w-11 max-lg:-mr-1.5` square button with the glyph centered (burger via `place-content-center`, X via `place-items-center`) — so the X lands **exactly on the burger** when the menu opens; **edit both together**. The full-screen menu reuses the **same lockup in blue** (`src/assets/menu/blue-logo.webp`, for its light bg) at matching sizes (`h-10` mobile / `h-[54px]` desktop); its open animation is an opacity **fade** (the old curtain-slide was removed, see `global.css`) and the active nav item is `text-accent`. **Mobile hero video:** a separate slot — `hero-video-mobile.webm`/`.mp4` in `src/assets/hero/` (currently a placeholder copy of the desktop video; the user replaces the files, no code change). `HeroSlider.tsx` picks desktop-vs-mobile `<source>` via `matchMedia("(max-width:1023px)")` and gates them behind `mounted` (+ `preload="none"` until then) so **only the viewport-correct video downloads** — the heavy desktop video never loads on mobile.
- **Verification:** run `pnpm check` (and usually `pnpm build`) before claiming done. **Do NOT auto-run the Playwright MCP** — only drive it for visual verification when the user explicitly asks for it (e.g. "проверь в браузере", "сделай скриншот"). The user reviews the render themselves; default to making the change + `pnpm check` and stopping there.

## MagicPath design source (reference / tweaks)

Design now lives on **MagicPath** (MagicCanvas) — the old `design/design.pen` is **legacy** and Pencil may be disconnected; don't rely on it. Access MagicPath via the **`magicpath` skill** (CLI `npx -y magicpath-ai`; installed at `.agents/skills/magicpath`). Canvas project: **`taiji-front`**, projectId `414285134272016384`.

- **Read exact values from nodes, not screenshots:** `npx -y magicpath-ai inspect <generatedName> -o json` gives a block's measurements/tokens.
- The 9 mobile blocks were ported one-component-per-block. generatedName map: hero(1)=`fancily-gulf-3410`, about(2)=`zesty-ocean-4806`, research(3)=`rapidly-lake-1090`, news(4)=`peacefully-lake-8129`, society(5)=`proud-ground-5647`, contacts(6)=`fancy-brook-6500`, footer=`wondrous-cave-7664`, loader=`lively-grass-2905`, menu=`rapidly-ground-8774`.
- The mobile layout itself is **already built in code** (`max-lg:` overrides on the desktop components, per the Hero pattern); use `inspect` to verify/extend values.
- Tokens to mirror when authoring on the canvas: ink `#0d1014`, accent/brand `#023c97`, surface `#f7f5f4`, surface-sunken `#f2f1ef`, field `#eeece9`; fonts Manrope (`font-display`) / Inter (`font-sans`) / Cormorant (`font-serif`).
- **MagicPath render gotchas:** `<img src=".svg">` does **not** render in MagicPath builds (broken image) — rasterize SVG→PNG (`sharp`) or inline the `<svg>` markup; and CJK glyphs (太极拳) tofu in headless preview — load Noto Serif SC via Google Fonts with `&text=<only the needed chars>`.

## Tooling for visual work

- **Agentation** (dev-only visual feedback): a toolbar mounted in `BaseLayout` via `src/lib/agentation-dev.ts` (dynamic import gated by `import.meta.env.DEV` → fully stripped from prod). The `agentation` MCP server streams the user’s on-page annotations: `agentation_get_all_pending` to read, `agentation_resolve` after fixing.
- **Playwright MCP** (`playwright`, runs system Chrome): **only when the user explicitly requests it** (see Verification above) — do not invoke it on your own initiative. When asked: drive `http://localhost:4321` to screenshot/measure the real render. Use element screenshots (`section:nth-of-type(n)`, `footer`) and `browser_evaluate` for opacity/position/`scrollWidth`-overflow checks. **Resize to 1440** to verify the intended layout; **delete temp screenshots from the repo root** when done.

## Gotchas

- **`client:visible` flicker:** hydrate-on-scroll islands flickered/blanked under `<ClientRouter />`. Use **`client:load`** for sliders.
- **Named slots into a React island wrap in `<astro-slot>`/`<astro-static-slot>`** (default `display:inline`), which breaks a flex column. Hero fixes this with `:global(astro-slot),:global(astro-static-slot){display:contents}` in its `<style>` so slotted header/footer become direct flex children. Custom CSS vars in a React `style={}` also need an `as CSSProperties` cast (ts2353) — but prefer a class toggle over inline vars where possible.
- **Stale Vite deps:** after `pnpm -C apps/web add …` while `pnpm dev` is running, the browser may 504 “Outdated Optimize Dep” and break hydration → **restart `pnpm dev`** (re-optimizes deps).
- **`data-reveal` on the page’s last element won’t fire:** ScrollTrigger `top 85%` is unreachable at max scroll, so it stays `opacity:0`. Don’t put `data-reveal` on the bottom-most element (resolves itself once more content is added below).
- **Full-bleed + horizontal scroll:** elements wider than the viewport (full-bleed bgs, `w-screen`, bleeding sliders) need `overflow-x-clip` on their section/footer so they don’t add page-level horizontal scroll. Verify `scrollWidth ≤ innerWidth`.
- **`position:sticky` dies under a clipping ancestor:** any ancestor between the sticky element and the scroll root with `overflow:hidden/clip/auto/scroll` silently kills stickiness — so the hero parallax would stop pinning. The hero’s chain (`body` → `astro-island` `display:contents` → `section`) is clean; the only `overflow:hidden` rules (`html.loading`, `.lenis-stopped`) apply **only during the loader**, not during scroll. Don’t add `overflow` to `html`/`body`/the content wrapper, or the hero stops sticking (this is also why full-bleed clipping uses `overflow-x-clip` on the inner block, not a global overflow).
- **`backdrop-filter` over moving content = jank:** a large `backdrop-blur` recomputes **every frame** when what’s behind it changes (autoplay video, hydrating islands), tanking FPS. The loader uses a pre-baked static frosted **image** instead of a live blur.
- **First-load animation stutter:** main-thread JS animations (GSAP rAF) stutter during the initial hydration/decode burst. Defer the start to `requestIdleCallback` (the loader does this) and judge smoothness in **prod** (`pnpm build && pnpm preview`) — dev (HMR + React dev + unbundled modules) is always jankier on first load.

## Placeholders awaiting real content/assets

Person photos (News featured, Society slider) are `bg-surface` boxes; Society calligraphy is `太极拳` text; Footer banner bg image is omitted; slider/card copy is duplicated/static (CMS later — the Hero’s 3 slides are currently the same content). Tabs/links use `href="#"`.

## Reference docs

An Astro docs MCP server (`mcp__astro-docs__search_astro_docs`) is configured for this project — prefer it for Astro 6 API questions over memory, since Astro 6 is recent.
