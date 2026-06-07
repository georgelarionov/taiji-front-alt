// Анимационный рантайм сайта: плавный скролл (Lenis) + reveal-анимации (GSAP).
//
// Главное: при включённом <ClientRouter /> навигация SPA-подобная — скрипты
// НЕ перезапускаются. Поэтому всё пересоздаётся на `astro:page-load`
// (срабатывает и на первой загрузке, и после каждой навигации) и чистится
// на `astro:before-swap`. Это закрывает гочу с "отваливающимися" анимациями.

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
        ease: "power3.out",
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
        ease: "power3.out",
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
        ease: "power3.out",
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

document.addEventListener("astro:page-load", init);
document.addEventListener("astro:before-swap", destroy);
