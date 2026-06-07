import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSwipe } from "../lib/useSwipe";

// Слайдер hero-блока (1-block). Остров client:load (не client:visible — см. гайдлайн):
// владеет индексом активного слайда и меняет фон (cross-fade видео/изображения)
// и текст+кнопку. Статичная обвязка (шапка, нижняя плашка) приходит из Hero.astro
// через слоты header/footer → остаётся нулевым JS. Слайдер НЕ зациклен: стрелка
// на крайнем слайде гаснет до 50% (требование макета).

export type HeroSlide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  // Фон слайда: либо видео (webm+mp4+постер), либо статичное изображение.
  // У видео опционально свой мобильный набор источников `mobile` — «оба или ничего»
  // (webm+mp4 в одном под-объекте, так не родится <source src={undefined}>): под
  // <1024px остров грузит ИХ вместо десктопного видео (см. matchMedia ниже).
  bg:
    | {
        type: "video";
        webm: string;
        mp4: string;
        poster: string;
        mobile?: { webm: string; mp4: string; poster?: string };
      }
    | { type: "image"; url: string };
};

// Стрелка карусели — та же геометрия пути, что в остальных слайдерах сайта.
const ARROW =
  "M12.1716 6.77822l-5.364-5.36401 1.4142-1.41421 7.7782 7.77822-7.7782 7.7781-1.4142-1.4142 5.364-5.3639-12.1716 0 0-2 12.1716 0z";

export default function HeroSlider({
  slides,
  header,
  footer,
}: {
  slides: HeroSlide[];
  header?: ReactNode;
  footer?: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const n = slides.length;
  const s = slides[index];
  const atStart = index === 0;
  const atEnd = index === n - 1;
  const prev = () => setIndex((v) => Math.max(0, v - 1));
  const next = () => setIndex((v) => Math.min(n - 1, v + 1));

  // Свайп пальцем по hero (мобайл): влево → следующий, вправо → предыдущий.
  // Вешаем на корневую section (touch-pan-y ниже сохраняет вертикальный скролл).
  const rootRef = useRef<HTMLElement>(null);
  useSwipe(rootRef, { onLeft: next, onRight: prev });

  // Первый показ hero привязан к УХОДУ лоудера-сплэша, а не к фиксированному таймеру:
  // лоудер на завершении кидает 'taiji:loader-done' (см. lib/loader.ts), а его
  // присутствие до этого помечено классом html.loading (ставится в <head> до пейнта).
  // revealed=false → текст скрыт (CSS), видео ждёт. Переключаем в true:
  //   • если лоудера нет (html.loading отсутствует: повторный заход за сессию,
  //     SPA-навигация или reduced-motion, либо лоудер ушёл ещё до гидрации) — сразу;
  //   • иначе — по событию ухода лоудера.
  // Так нет рассинхрона «фиксированная задержка ≠ реальная длительность лоудера».
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    // «Липкий» флаг loaderDone закрывает гонку: если лоудер ушёл (и кинул раннее
    // событие) ДО гидрации острова, one-shot listener бы уже не сработал → читаем
    // dataset-флаг, чтобы не зависнуть скрытым. Reveal сразу, если лоудера нет
    // (нет html.loading: повтор за сессию / SPA / reduced-motion) ИЛИ он уже ушёл.
    if (!html.classList.contains("loading") || html.dataset.loaderDone === "1") {
      setRevealed(true);
      return;
    }
    const onDone = () => setRevealed(true);
    document.addEventListener("taiji:loader-done", onDone, { once: true });
    return () => document.removeEventListener("taiji:loader-done", onDone);
  }, []);

  // Выбор источника фона по вьюпорту: <1024px (max-lg) → мобильное видео слайда.
  // mounted=false до гидрации → <source> не рендерим и preload="none" → НИ desktop,
  // НИ mobile видео не качается на сервере/до выбора; после монтирования ставим
  // реальный isMobile и грузим ТОЛЬКО нужный файл (десктопное видео не уходит на мобилу).
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    setMounted(true);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Играет только видео активного слайда; остальные на паузу (экономия CPU и чтобы
  // фон не «убегал» по таймлайну). Старт ждёт reveal (первый показ — после лоудера);
  // при смене слайдов revealed уже true → активное видео играет сразу.
  // mounted/isMobile в зависимостях: при их смене <video> ремонтируется (key ниже)
  // с новыми <source> → эффект перезапускается и доигрывает активный слайд.
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (v && i !== index) v.pause();
    });
    if (!revealed) return;
    // Уважаем reduced-motion (консистентно с smooth.ts): не автозапускаем видео —
    // постер остаётся статичным кадром.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const active = videoRefs.current[index];
    if (!active) return;
    const p = active.play();
    if (p) p.catch(() => {});
  }, [index, revealed, mounted, isMobile]);

  return (
    <section
      ref={rootRef}
      className="sticky top-0 z-0 h-svh min-h-[640px] w-full touch-pan-y overflow-hidden text-white"
    >
      {/* Слой фона: все слайды стопкой; активный непрозрачен, остальные прозрачны →
          смена через transition opacity = cross-fade. */}
      <div className="absolute inset-0 -z-20">
        {slides.map((slide, i) => (
          <div
            key={i}
            aria-hidden={i !== index}
            className="absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none"
            style={{ opacity: i === index ? 1 : 0 }}
          >
            {slide.bg.type === "video" ? (
              <video
                key={mounted ? (isMobile && slide.bg.mobile ? "m" : "d") : "init"}
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                className="h-full w-full object-cover object-right max-lg:object-[75%_50%]"
                muted
                playsInline
                preload={mounted ? "auto" : "none"}
                poster={
                  (isMobile && slide.bg.mobile?.poster) || slide.bg.poster
                }
              >
                {mounted &&
                  (isMobile && slide.bg.mobile ? (
                    <>
                      <source src={slide.bg.mobile.webm} type="video/webm" />
                      <source src={slide.bg.mobile.mp4} type="video/mp4" />
                    </>
                  ) : (
                    <>
                      <source src={slide.bg.webm} type="video/webm" />
                      <source src={slide.bg.mp4} type="video/mp4" />
                    </>
                  ))}
              </video>
            ) : (
              <img
                src={slide.bg.url}
                alt=""
                className="h-full w-full object-cover object-right max-lg:object-[75%_50%]"
              />
            )}
          </div>
        ))}
      </div>

      {/* Скрим: контраст для белого текста поверх фона. На мобиле (max-lg) темнее —
          по макету 1-block-mobile, для читаемости на малом экране. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/35 via-black/10 to-black/40 max-lg:from-black/65 max-lg:to-black/70"
      />

      <div className="flex h-full w-full flex-col">
        {/* ───────── Шапка (статичная, из слота) ───────── */}
        {header}
        <div className="h-px w-full bg-white/25" />

        {/* ───────── Hero-текст (сменяется по слайду) ─────────
            key={index} ремонтирует поддерево → staggered-ввод hero-rise (CSS в
            Hero.astro) переигрывается на каждой смене слайда. */}
        <div className="gutter-x flex flex-1 items-center">
          <div
            key={index}
            className={`flex max-w-[824px] flex-col gap-10 max-lg:max-w-none max-lg:gap-7${
              revealed ? " hero-revealed" : ""
            }`}
          >
            <div className="flex flex-col gap-1.5">
              <p
                data-rise="1"
                className="font-serif text-[28px] font-bold italic max-lg:text-lg"
              >
                {s.eyebrow}
              </p>
              <div className="flex flex-col gap-3 max-lg:gap-2.5">
                <h1
                  data-rise="2"
                  className="font-serif text-[60px] font-bold leading-[1.1] whitespace-nowrap max-lg:text-[36px] max-lg:leading-[1.08] max-lg:whitespace-normal"
                >
                  {s.title}
                </h1>
                <p
                  data-rise="3"
                  className="font-display text-lg font-semibold leading-snug max-lg:text-[15px] max-lg:opacity-85"
                >
                  {s.subtitle}
                </p>
              </div>
            </div>
            <a
              data-rise="4"
              href={s.ctaHref}
              className="inline-flex w-[260px] items-center justify-center rounded-[1px] bg-white px-10 py-[13px] font-display text-[15px] font-bold text-ink transition hover:bg-white/90 active:scale-[0.98] max-lg:w-full max-lg:px-6 max-lg:py-3.5"
            >
              {s.ctaText}
            </a>
          </div>
        </div>

        {/* ───────── Контролы карусели ───────── */}
        <div className="gutter-x flex items-center justify-between pb-6 max-lg:pb-4">
          <button
            type="button"
            onClick={prev}
            disabled={atStart}
            aria-label="Предыдущий слайд"
            className={`grid h-9 w-9 rotate-180 place-items-center rounded-[2px] transition enabled:cursor-pointer enabled:hover:bg-white/15 enabled:active:scale-90 max-lg:h-11 max-lg:w-11 ${
              atStart ? "opacity-50" : "opacity-100"
            }`}
          >
            <svg
              viewBox="0 0 16 15.5563"
              className="h-[20.74px] w-[21.33px]"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d={ARROW} />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Перейти к слайду ${i + 1}`}
                aria-current={i === index}
                className="flex h-4 cursor-pointer items-center max-lg:h-11"
              >
                <span
                  className={`h-1 rounded-full bg-white transition-all duration-300 ${
                    i === index ? "w-[65px]" : "w-6 opacity-35 hover:opacity-60"
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            disabled={atEnd}
            aria-label="Следующий слайд"
            className={`grid h-9 w-9 place-items-center rounded-[2px] transition enabled:cursor-pointer enabled:hover:bg-white/15 enabled:active:scale-90 max-lg:h-11 max-lg:w-11 ${
              atEnd ? "opacity-50" : "opacity-100"
            }`}
          >
            <svg
              viewBox="0 0 16 15.5563"
              className="h-[20.74px] w-[21.33px]"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d={ARROW} />
            </svg>
          </button>
        </div>

        {/* ───────── Нижняя плашка (статичная, из слота) ───────── */}
        <div className="h-px w-full bg-white/25" />
        {footer}
      </div>

      {/* Слой затемнения параллакса: едет opacity 0 → 0.5 за первый экран
          (GSAP scrub в lib/smooth.ts). Поверх всего hero (z-30: выше фона -z-20,
          скрима -z-10 и flex-контента) → темнеет весь блок целиком, пока контент
          ниже наезжает сверху. pointer-events-none — контролы остаются кликабельны.
          suppressHydrationWarning: opacity этого слоя ставит GSAP (setupHeroParallax)
          инлайном ещё до гидрации острова → React-VDOM (без style) разойдётся с DOM.
          Слой целиком на откупе GSAP, поэтому расхождение глушим (React его не трогает). */}
      <div
        data-hero-darken
        aria-hidden="true"
        suppressHydrationWarning
        className="pointer-events-none absolute inset-0 z-30 bg-ink opacity-0"
      />
    </section>
  );
}
