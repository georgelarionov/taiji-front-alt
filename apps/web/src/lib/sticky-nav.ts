// Поведение фиксированной «подъезжающей» шапки (StickyNav.astro). Показываем шапку
// (.is-visible), когда обычная шапка страницы (Header.astro, [data-page-header])
// ушла из поля зрения. Триггер зависит от типа шапки (значение data-page-header):
//   • overlay (главная): обычная шапка закреплена в sticky-герое и геометрически НЕ
//     покидает вьюпорт — контент едет ПОВЕРХ запиненного героя (параллакс-оверлэп),
//     поэтому IntersectionObserver по ней не сработает. Показываем после прокрутки
//     на высоту вьюпорта (≈ высота полноэкранного героя), rAF-троттлинг.
//   • solid (внутренние): обычная шапка прокручивается → как только она ушла из
//     вьюпорта, подъезжает закреплённая. IntersectionObserver: порог = реальная
//     высота шапки (~94px), без мёртвой зоны на первый экран, resize-устойчиво.
//
// Lifecycle как у smooth.ts/menu.ts/loader.ts: при <ClientRouter /> скрипты не
// перезапускаются на навигации → подписку создаём на astro:page-load и снимаем на
// astro:before-swap (иначе утечёт / шапка зависнет на новой странице).

// Делает файл модулем (изолированная область видимости) — иначе TS считает его
// глобальным скриптом и init() коллизит с одноимёнными в других lib-скриптах.
export {};

let cleanup: (() => void) | null = null;

function init() {
  const nav = document.querySelector<HTMLElement>("[data-sticky-nav]");
  const header = document.querySelector<HTMLElement>("[data-page-header]");
  if (!nav || !header) return;

  // Главная: шапка-overlay запинена в герое → ориентируемся на прокрутку на экран.
  if (header.dataset.pageHeader === "overlay") {
    let threshold = window.innerHeight;
    let ticking = false;
    const update = () => {
      ticking = false;
      nav.classList.toggle("is-visible", window.scrollY >= threshold);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    const onResize = () => {
      threshold = window.innerHeight;
      update();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    update(); // начальное состояние (восстановленный скролл после навигации)
    cleanup = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cleanup = null;
    };
    return;
  }

  // Внутренние страницы: обычная шапка прокручивается — показываем закреплённую,
  // как только она НЕ пересекает вьюпорт. observe() сразу даёт начальное состояние.
  const io = new IntersectionObserver(
    ([entry]) => nav.classList.toggle("is-visible", !entry.isIntersecting),
    { threshold: 0 },
  );
  io.observe(header);
  cleanup = () => {
    io.disconnect();
    cleanup = null;
  };
}

document.addEventListener("astro:page-load", () => {
  cleanup?.(); // подстраховка от повторной инициализации
  init();
});
document.addEventListener("astro:before-swap", () => cleanup?.());
