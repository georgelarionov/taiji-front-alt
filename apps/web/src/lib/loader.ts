// Рантайм лоудера: GSAP-таймлайн (fade-in элементов + «отрисовка» круга через
// маску, затем уход вверх). Лоудер виден только при html.loading (ставит
// инлайн-скрипт в BaseLayout до пейнта: первый визит на сайт, без reduced-motion).
//
// Lifecycle как у smooth.ts: при <ClientRouter /> скрипты не перезапускаются на
// навигации, поэтому init на astro:page-load, teardown на astro:before-swap.

import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);
// Плавный ease ухода (из референса).
CustomEase.create("loader", "0.65, 0.01, 0.05, 0.99");

// Тайминги (сек) — подгоняй здесь. Общая ≈ HOLD_UNTIL + EXIT.
const FADE_IN = 1.6; // длительность fade-in элементов (плавное появление)
const CIRCLE_START = 0.3; // старт отрисовки круга — позже первых (самых занятых) кадров загрузки
const DRAW = 3.2; // длительность отрисовки круга
const HOLD_UNTIL = 3.8; // момент начала ухода (после отрисовки — пауза)
const EXIT = 1.2; // длительность ухода вверх
const CONTENT_LIFT = -18; // доп. сдвиг контента вверх на уходе (yPercent) → лёгкий параллакс к фону
// Опережение сигнала hero: событие taiji:loader-done шлётся за REVEAL_LEAD секунд
// ДО полного ухода (во время фазы EXIT), а не в onComplete. Hero (текст+видео)
// оживает из-под ещё уезжающей панели → бесшовная стыковка. Должно быть ≤ EXIT.
const REVEAL_LEAD = 0.8;

// Флаг «лоудер уже показан» в localStorage (НЕ sessionStorage) → один раз при
// самом первом визите на сайт, без повторов в новых сессиях/вкладках. Тот же
// ключ читает инлайн-скрипт BaseLayout (решает, ставить ли html.loading).
const STORAGE_KEY = "taiji:loaded";

let tl: gsap.core.Timeline | null = null;
let idleHandle = 0; // хэндл отложенного старта анимации (rIC/таймаут)
// Сигнал hero шлём один раз за прогон (ранний — из таймлайна, либо из finish для
// reduced-motion-ветки). Флаг защищает от повторной отправки.
let revealSignaled = false;

function signalReveal() {
  if (revealSignaled) return;
  revealSignaled = true;
  // «Липкий» флаг + событие: если остров hero смонтируется ПОСЛЕ раннего
  // dispatch, one-shot listener уже не сработает → читая dataset на маунте, остров
  // всё равно узнает, что лоудер ушёл (иначе hero завис бы скрытым навсегда).
  document.documentElement.dataset.loaderDone = "1";
  document.dispatchEvent(new CustomEvent("taiji:loader-done"));
}

function finish(wrap: HTMLElement) {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {}
  document.documentElement.classList.remove("loading"); // разблок скролла
  wrap.style.display = "none";
  signalReveal(); // страховка: ранний сигнал уже ушёл из таймлайна; здесь — для reduced-motion
}

function run() {
  const root = document.documentElement;
  // Гейт. Класс ставит инлайн-скрипт только при первом визите на сайт без
  // reduced-motion → отсутствие класса = SPA-переход / повтор / reduced-motion / no-JS.
  if (!root.classList.contains("loading")) return;

  revealSignaled = false; // новый прогон (в т.ч. SPA-навигация) → разрешаем сигнал заново
  delete document.documentElement.dataset.loaderDone; // сбрасываем «липкий» флаг прошлого прогона

  const wrap = document.querySelector<HTMLElement>("[data-loader]");
  if (!wrap) {
    root.classList.remove("loading");
    return;
  }

  // Доп. страховка от reduced-motion: мгновенно завершить, без анимации.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finish(wrap);
    return;
  }

  const fades = gsap.utils.toArray<HTMLElement>("[data-loader-fade]", wrap);
  const ring = wrap.querySelector<SVGCircleElement>("[data-loader-ring]");
  const content = wrap.querySelector<HTMLElement>("[data-loader-content]");

  tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete: () => finish(wrap),
  });

  // Плавное проявление всех элементов (кроме круга) — чистый fade-in, без слайда.
  tl.fromTo(
    fades,
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: FADE_IN, ease: "sine.inOut", stagger: 0.1 },
    0,
  );

  // «Отрисовка» круга: маска dashoffset -100 → 0. Старт сдвинут на CIRCLE_START —
  // первые (самые занятые) кадры загрузки заняты только GPU-фейдом, без CPU-маски.
  if (ring) {
    tl.fromTo(
      ring,
      { strokeDashoffset: -100 },
      { strokeDashoffset: 0, duration: DRAW, ease: "power1.in" },
      CIRCLE_START,
    );
  }

  // Уход после паузы: фон-панель уезжает вверх...
  tl.to(wrap, { yPercent: -100, duration: EXIT, ease: "loader" }, HOLD_UNTIL);

  // ...контент уезжает чуть выше фона + фейд → лёгкий параллакс (тот же ease).
  if (content) {
    tl.to(
      content,
      { yPercent: CONTENT_LIFT, autoAlpha: 0, duration: EXIT, ease: "loader" },
      HOLD_UNTIL,
    );
  }

  // Ранний сигнал hero — за REVEAL_LEAD до конца ухода: текст и видео стартуют,
  // пока панель ещё доезжает вверх → нет «мёртвого кадра» статичного hero.
  tl.call(signalReveal, undefined, HOLD_UNTIL + EXIT - REVEAL_LEAD);
}

function cleanup() {
  if (idleHandle) {
    if (typeof cancelIdleCallback === "function") cancelIdleCallback(idleHandle);
    else clearTimeout(idleHandle);
    idleHandle = 0;
  }
  tl?.kill();
  tl = null;
  // Если навигация прервала лоудер до onComplete — снять гейт, иначе html.loading
  // (и блок скролла) утечёт на следующую страницу.
  const root = document.documentElement;
  if (root.classList.contains("loading")) {
    root.classList.remove("loading");
    const wrap = document.querySelector<HTMLElement>("[data-loader]");
    if (wrap) wrap.style.display = "none";
  }
}

// Старт анимации откладываем до простоя основного потока: на первой загрузке
// гидратация островов и декод изображений заняты main-thread, и таймлайн,
// стартующий в этот момент, дёргается в первых кадрах. requestIdleCallback
// (с таймаут-фолбэком) даёт анимации начаться уже на свободном потоке → плавно сразу.
function scheduleRun() {
  if (!document.documentElement.classList.contains("loading")) return;
  if (typeof requestIdleCallback === "function") {
    idleHandle = requestIdleCallback(run, { timeout: 500 });
  } else {
    // window.setTimeout → DOM-overload (number), а не Node (Timeout): apps/web —
    // браузерный код, @types/node иначе ломает тип idleHandle (ts2322).
    idleHandle = window.setTimeout(run, 200);
  }
}

document.addEventListener("astro:page-load", scheduleRun);
document.addEventListener("astro:before-swap", cleanup);
