// Анимационный рантайм сайта: плавный скролл (Lenis) + reveal-анимации (GSAP).
//
// Главное: при включённом <ClientRouter /> навигация SPA-подобная — скрипты
// НЕ перезапускаются. Поэтому всё пересоздаётся на `astro:page-load`
// (срабатывает и на первой загрузке, и после каждой навигации) и чистится
// на `astro:before-swap`. Это закрывает гочу с "отваливающимися" анимациями.

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, CustomEase);
// Единая кривая ускорения reveal-анимаций — та же, что у CSS-токена --ease-smooth
// (cubic-bezier(0.22, 1, 0.36, 1), easeOutQuint). Так JS- и CSS-движение по сайту
// идут «одной рукой»: мягкое expo-подобное приземление вместо более резкого power3.
CustomEase.create("smooth", "0.22, 1, 0.36, 1");

let lenis: Lenis | null = null;
let rafId = 0;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function startSmoothScroll() {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  // Синхронизируем Lenis со ScrollTrigger, иначе триггеры "плывут".
  lenis.on("scroll", ScrollTrigger.update);

  const raf = (time: number) => {
    lenis?.raf(time);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);
}

function setupReveals() {
  const targets = gsap.utils.toArray<HTMLElement>("[data-reveal]");
  targets.forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 32 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "smooth",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      },
    );
  });
}

// Фоновое изображение блока [data-reveal-bg] появляется отдельно от карточек —
// фейд + лёгкий слайд снизу, когда скролл дошёл до СЕРЕДИНЫ блока (центр триггера
// у нижней части вьюпорта). Так фон оживает позже карточек (те — на top 85%),
// давая слоистое раскрытие. Порог раскрытия — start ниже (легко тюнится).
function setupBgReveals() {
  const targets = gsap.utils.toArray<HTMLElement>("[data-reveal-bg]");
  targets.forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 40 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        ease: "smooth",
        scrollTrigger: { trigger: el, start: "center 80%", once: true },
      },
    );
  });
}

// Карточки внутри [data-reveal-stagger] въезжают каскадом (stagger), а не каждая
// по отдельности — более выраженный плавный slide-in. Триггер — на контейнере,
// чтобы дети анимировались согласованно, а не по мере пересечения каждым порога.
function setupStaggeredReveals() {
  const groups = gsap.utils.toArray<HTMLElement>("[data-reveal-stagger]");
  groups.forEach((group) => {
    const items = gsap.utils.toArray<HTMLElement>("[data-reveal-item]", group);
    if (!items.length) return;
    gsap.fromTo(
      items,
      { autoAlpha: 0, y: 48 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        ease: "smooth",
        stagger: 0.15,
        scrollTrigger: { trigger: group, start: "top 85%", once: true },
      },
    );
  });
}

// Параллакс-перекрытие hero: hero — неподвижный sticky-фон (z-0, CSS в
// HeroSlider), контент ниже (z-10) наезжает поверх. Здесь — только затемнение
// hero: слой [data-hero-darken] едет opacity 0 → 0.5, привязанный (scrub) к
// прогрессу скролла за первый экран. Само перекрытие — чистый CSS sticky, без
// ScrollTrigger-pin (он добавляет pin-spacer'ы, капризные в связке с Lenis).
function setupHeroParallax() {
  const overlay = document.querySelector<HTMLElement>("[data-hero-darken]");
  const hero = overlay?.closest("section");
  if (!overlay || !hero) return;
  gsap.fromTo(
    overlay,
    { opacity: 0 },
    {
      opacity: 0.5,
      ease: "none",
      // start/end меряются от слота hero в потоке (sticky его резервирует, 100svh
      // у верха документа), а не от «прилипшей» позиции → маппинг 0→100svh верный.
      scrollTrigger: {
        trigger: hero,
        start: "top top", // скролл 0
        end: "bottom top", // низ hero у верха вьюпорта ≈ 100svh (полное перекрытие)
        scrub: true,
      },
    },
  );
}

function init() {
  if (prefersReducedMotion()) {
    // Без анимаций — просто показываем контент.
    gsap.set("[data-reveal], [data-reveal-item], [data-reveal-bg]", {
      autoAlpha: 1,
      y: 0,
    });
    return;
  }
  startSmoothScroll();
  setupReveals();
  setupBgReveals();
  setupStaggeredReveals();
  setupHeroParallax();
  ScrollTrigger.refresh();
}

function destroy() {
  cancelAnimationFrame(rafId);
  rafId = 0;
  lenis?.destroy();
  lenis = null;
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

// Во время лоудера (html.loading) скролл залочен, а hero перекрыт — поднимать
// Lenis/ScrollTrigger в этот момент незачем. А их init конкурирует с анимацией
// лоудера за main-thread (rAF Lenis на все ~5с + синхронный ScrollTrigger.refresh
// = layout-pass ровно на старте лоудера → джанк/фриз). Поэтому при активном лоудере
// откладываем init до его ухода (событие taiji:loader-done, шлётся из lib/loader.ts) —
// симметрично reveal-контракту hero. Без лоудера (SPA-навигация / повтор за сессию /
// reduced-motion / no-JS) html.loading не стоит → init сразу, как раньше.
function onPageLoad() {
  const root = document.documentElement;
  if (root.classList.contains("loading") && !prefersReducedMotion()) {
    // «Липкий» флаг закрывает гонку: если лоудер уже сигналил до этого момента.
    if (root.dataset.loaderDone === "1") {
      init();
      return;
    }
    document.addEventListener("taiji:loader-done", init, { once: true });
    return;
  }
  init();
}

document.addEventListener("astro:page-load", onPageLoad);
document.addEventListener("astro:before-swap", () => {
  // Снять отложенный init, если навигация прервала лоудер до его ухода.
  document.removeEventListener("taiji:loader-done", init);
  destroy();
});
