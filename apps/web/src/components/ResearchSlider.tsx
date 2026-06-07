import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useSwipe } from "../lib/useSwipe";

// Слайдер «Исследования» (3-block). Карточки тянутся вправо за вьюпорт; клипает
// секция (overflow-x-clip) → горизонтального скролла страницы нет. Сдвиг — через
// transform на треке (не scroll). Клик по стрелкам двигает трек влево/вправо.

export type ResearchCard = {
  year: string;
  category: string;
  title: string;
  desc: string;
};

// Стрелка — та же геометрия, что в hero (viewBox 0 0 16 15.5563), здесь чёрная.
const ARROW =
  "M12.1716 6.77822l-5.364-5.36401 1.4142-1.41421 7.7782 7.77822-7.7782 7.7781-1.4142-1.4142 5.364-5.3639-12.1716 0 0-2 12.1716 0z";

// Геометрия слайдера зависит от вьюпорта (десктоп / <1024px).
// Десктоп: карточки 520px, gap 24, последний слайд в 44px от правого края (симметрично px-11 контейнера).
// Мобила (max-lg): карточки 320px, gap 16, последний слайд в 15px (симметрично px-[15px]) — peek следующей карты.
// Tailwind-классы карточки/трека дублируют эти значения через max-lg: (ниже), числа здесь нужны для measure()/STEP.
const DESKTOP = { cardW: 520, gap: 24, rightGap: 44 };
const MOBILE = { cardW: 320, gap: 16, rightGap: 16 };

// «Подробнее»: анимированное подчёркивание, проявляется на hover карточки
// (group-hover). Растёт слева направо (origin-left). Линия — accent c opacity 50%.
// inline-block — линия по ширине текста, не по ширине обёртки; relative — база для after.
const MORE_CLASS =
  "relative inline-block font-display text-base font-semibold text-accent after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent/50 after:transition-transform after:duration-300 group-hover:after:scale-x-100 max-lg:text-[15px]";

export default function ResearchSlider({ cards }: { cards: ResearchCard[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  // Геометрия (ширина карточки/gap/правый отступ) переключается по вьюпорту:
  // <1024px (max-lg) → MOBILE, иначе DESKTOP. STEP = шаг прокрутки на одну карточку.
  const [isMobile, setIsMobile] = useState(false);
  const geo = isMobile ? MOBILE : DESKTOP;
  const step = geo.cardW + geo.gap;

  // Появление: когда слайдер въезжает во вьюпорт, карточки выезжают снизу с фейдом,
  // по очереди слева направо (stagger по индексу). once — играем один раз.
  const inView = useInView(viewportRef, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();

  // mounted=false на SSR и до гидрации → статический HTML карточек уходит видимым
  // (initial={false} = состояние 'shown', без opacity:0/translateY). Вход-анимация
  // включается ТОЛЬКО после гидрации (mounted=true), как reveal-система под html.js.
  // Так без JS / при падении гидрации / reduced-motion карточки остаются видимы.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Видимая ширина = от левого края контейнера до правого края вьюпорта
  // (карточки full-bleed вправо). maxScroll не даёт уехать в пустоту за последней.
  // rightGap зависит от вьюпорта (44px десктоп / 15px мобила — симметрично гаттеру).
  const measure = useCallback(() => {
    const track = trackRef.current;
    const vp = viewportRef.current;
    if (!track || !vp) return;
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    setIsMobile(mobile);
    const rightGap = mobile ? MOBILE.rightGap : DESKTOP.rightGap;
    const visibleWidth = window.innerWidth - vp.getBoundingClientRect().left;
    const ms = Math.max(0, track.scrollWidth - visibleWidth + rightGap);
    setMaxScroll(ms);
    setOffset((o) => Math.max(-ms, Math.min(0, o)));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const prev = () => setOffset((o) => Math.min(0, o + step));
  const next = () => setOffset((o) => Math.max(-maxScroll, o - step));

  // Свайп пальцем по треку (мобайл): шаг = одна карточка, как у стрелок.
  useSwipe(viewportRef, { onLeft: next, onRight: prev });

  // Число дискретных позиций (точек) выводим из самой прокрутки, а не хардкодим:
  // maxScroll/step ≈ сколько шагов карточки помещается, +1 за стартовую позицию.
  // maxScroll===0 → всё влезло, одна позиция (точки/стрелки не нужны).
  const progress = maxScroll > 0 ? -offset / maxScroll : 0;
  const steps = maxScroll > 0 ? Math.round(maxScroll / step) + 1 : 1;
  const activeDot = maxScroll > 0 ? Math.round(progress * (steps - 1)) : 0;
  const atStart = offset >= 0;
  const atEnd = maxScroll === 0 || offset <= -maxScroll;

  return (
    <div>
      {/* viewport: трек выезжает за правый край вьюпорта, клипает секция */}
      <div ref={viewportRef} className="mt-14 touch-pan-y max-lg:mt-8">
        <div
          ref={trackRef}
          className="flex gap-6 transition-transform duration-500 ease-out max-lg:gap-4"
          style={{ transform: `translateX(${offset}px)` }}
        >
          {cards.map((c, i) => (
            <motion.a
              key={i}
              href="#"
              // initial={false} → SSR/no-JS/до гидрации рендерит 'shown' (видимо).
              // 'hidden' (вход-анимация) применяется только после гидрации и не под
              // reduced-motion: mounted && !reduce. Иначе всегда 'shown'.
              variants={{
                hidden: { opacity: 0, y: 40 },
                shown: { opacity: 1, y: 0 },
              }}
              initial={false}
              animate={
                mounted && !reduce ? (inView ? "shown" : "hidden") : "shown"
              }
              transition={{
                duration: 1.25,
                delay: reduce ? 0 : 0.45 + i * 0.16,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative flex h-[480px] w-[520px] shrink-0 cursor-pointer flex-col bg-white max-lg:h-[420px] max-lg:w-[320px] max-lg:border max-lg:border-black/15"
            >
              {/* hover-подложка как в «Новостях»: #f7f5f4, inset 8px, fade на group-hover */}
              <div className="pointer-events-none absolute inset-2 bg-[#f7f5f4] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10 flex h-full flex-col max-lg:justify-between max-lg:p-6">
                {/* Top: title + description */}
                <div className="flex flex-col gap-[17px] px-6 pt-8 max-lg:gap-3 max-lg:p-0">
                  <h3 className="font-display text-2xl font-semibold leading-[1.2] text-ink max-lg:text-[20px] max-lg:leading-[1.15]">
                    {c.title}
                  </h3>
                  <p className="font-sans text-base font-medium leading-[1.375] text-ink/70 max-lg:text-[15px] max-lg:leading-[1.4]">
                    {c.desc}
                  </p>
                </div>
                {/* Bottom: meta + divider + «Подробнее» — on mobile grouped in one block */}
                <div className="mt-auto flex flex-col max-lg:mt-0 max-lg:gap-4">
                  <div className="flex items-center gap-[18px] px-6 pb-7 max-lg:gap-2 max-lg:p-0">
                    <span className="font-display text-base font-semibold text-ink max-lg:text-[14px]">
                      {c.year}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-black/15 max-lg:h-[5px] max-lg:w-[5px] max-lg:bg-ink/20" />
                    <span className="font-display text-base font-semibold text-ink max-lg:text-[14px]">
                      {c.category}
                    </span>
                  </div>
                  <div className="h-px w-full bg-black/10" />
                  {/* py-5 = 20px сверху/снизу → «Подробнее» по центру футер-строки; px-6 — выравнивание с контентом */}
                  <div className="px-6 py-5 max-lg:p-0">
                    <span className={MORE_CLASS}>Подробнее</span>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>

      {/* контролы */}
      <div className="mt-14 flex items-center justify-between max-lg:mt-8">
        <button
          type="button"
          onClick={prev}
          disabled={atStart}
          aria-label="Предыдущие"
          className={`grid h-10 w-10 rotate-180 place-items-center rounded-[2px] text-ink transition max-lg:h-11 max-lg:w-11 active:scale-90 ${
            atStart ? "opacity-25" : "cursor-pointer opacity-100 hover:bg-ink/[0.06]"
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

        {steps > 1 ? (
          <div className="flex items-center gap-2">
            {Array.from({ length: steps }).map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full bg-ink transition-all duration-300 ${
                  i === activeDot ? "w-[65px]" : "w-6 opacity-35"
                }`}
              />
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={next}
          disabled={atEnd}
          aria-label="Следующие"
          className={`grid h-10 w-10 place-items-center rounded-[2px] text-ink transition max-lg:h-11 max-lg:w-11 active:scale-90 ${
            atEnd ? "opacity-25" : "cursor-pointer opacity-100 hover:bg-ink/[0.06]"
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

      {/* Кнопка «Все исследования» только на мобиле (max-lg) — на десктопе она в
          хедере блока (Research.astro). Full-width, accent, под рядом контролов. */}
      <a
        href="#"
        className="hidden max-lg:flex max-lg:mt-8 w-full items-center justify-center gap-[10px] bg-accent px-4 py-3 text-center font-display text-base font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
      >
        Все исследования
      </a>
    </div>
  );
}
