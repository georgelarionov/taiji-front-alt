import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useSwipe } from "../../lib/useSwipe";
import { ARROW_PATH } from "../../lib/icons";

// Слайдер «Другие новости» (низ страницы статьи). Тот же механизм и контролы,
// что у ResearchSlider: трек двигается transform'ом, карточки тянутся за правый
// край (full-bleed) и клипаются секцией (overflow-x-clip); стрелки ARROW_PATH,
// точки активная w-[65px] / неактивная w-6 opacity-35, свайп пальцем (useSwipe),
// появление со stagger. Карточки — новостные (дата → заголовок → «Подробнее»),
// ведут на /news/<slug>.

export type RelatedCard = {
  slug: string;
  date: string;
  title: string;
};

const ARROW = ARROW_PATH;

// Геометрия по вьюпорту (десктоп / <1024px), как в ResearchSlider.
// Десктоп: карточки 416px, gap 24, последний слайд в 44px от края (симметрично px-11).
// Мобила: карточки 300px, gap 16, последний в 16px (симметрично px-4) — peek следующей.
const DESKTOP = { cardW: 416, gap: 24, rightGap: 44 };
const MOBILE = { cardW: 300, gap: 16, rightGap: 16 };

const MORE_CLASS =
  "link-underline-group inline-block font-display text-base font-semibold text-accent max-lg:text-[15px]";

export default function RelatedNewsSlider({ cards }: { cards: RelatedCard[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  const [isMobile, setIsMobile] = useState(false);
  const geo = isMobile ? MOBILE : DESKTOP;
  const step = geo.cardW + geo.gap;

  const inView = useInView(viewportRef, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();

  // mounted=false до гидрации → статичный HTML карточек виден (как reveal под html.js).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  useSwipe(viewportRef, { onLeft: next, onRight: prev });

  const progress = maxScroll > 0 ? -offset / maxScroll : 0;
  const steps = maxScroll > 0 ? Math.round(maxScroll / step) + 1 : 1;
  const activeDot = maxScroll > 0 ? Math.round(progress * (steps - 1)) : 0;
  const atStart = offset >= 0;
  const atEnd = maxScroll === 0 || offset <= -maxScroll;

  return (
    <div role="group" aria-roledescription="карусель" aria-label="Другие новости">
      <div ref={viewportRef} className="mt-12 touch-pan-y max-lg:mt-8">
        <div
          ref={trackRef}
          className="flex gap-6 transition-transform duration-500 ease-smooth max-lg:gap-4"
          style={{ transform: `translateX(${offset}px)` }}
        >
          {cards.map((c, i) => (
            <motion.a
              key={c.slug}
              href={`/news/${c.slug}`}
              variants={{
                hidden: { opacity: 0, y: 40 },
                shown: { opacity: 1, y: 0 },
              }}
              initial={false}
              animate={mounted && !reduce ? (inView ? "shown" : "hidden") : "shown"}
              transition={{
                duration: 1.25,
                delay: reduce ? 0 : 0.45 + i * 0.16,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative flex h-[320px] w-[416px] shrink-0 cursor-pointer flex-col justify-between border border-border bg-white p-8 max-lg:h-[280px] max-lg:w-[300px] max-lg:p-6"
            >
              {/* hover-подложка как в «Новостях»/«Исследованиях»: surface, inset 8px */}
              <div className="pointer-events-none absolute inset-2 bg-surface opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10 flex flex-col gap-4 max-lg:gap-3">
                <span className="font-display text-base font-medium text-ink/60 max-lg:text-[14px]">
                  {c.date}
                </span>
                <h3 className="text-h3 line-clamp-4 text-ink">{c.title}</h3>
              </div>

              {/* Обёртка-блок: span остаётся inline-block (ширина = текст), иначе
                  как flex-ребёнок он растянулся бы и подчёркивание шло бы во всю карточку. */}
              <div className="relative z-10 mt-6">
                <span className={MORE_CLASS}>Подробнее</span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>

      {/* контролы (идентичны ResearchSlider) */}
      <div className="mt-12 flex items-center justify-between max-lg:mt-8">
        <button
          type="button"
          onClick={prev}
          disabled={atStart}
          aria-label="Предыдущие"
          className={`grid h-10 w-10 rotate-180 place-items-center rounded-[2px] text-ink transition max-lg:h-11 max-lg:w-11 active:scale-90 ${
            atStart ? "opacity-25" : "cursor-pointer opacity-100 hover:bg-ink/[0.06]"
          }`}
        >
          <svg viewBox="0 0 16 15.5563" className="h-[20.74px] w-[21.33px]" fill="currentColor" aria-hidden="true">
            <path d={ARROW} />
          </svg>
        </button>

        {steps > 1 ? (
          <div aria-hidden="true" className="flex items-center gap-2">
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

        {steps > 1 ? (
          <p aria-live="polite" aria-atomic="true" className="sr-only">
            {`Позиция ${activeDot + 1} из ${steps}`}
          </p>
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
          <svg viewBox="0 0 16 15.5563" className="h-[20.74px] w-[21.33px]" fill="currentColor" aria-hidden="true">
            <path d={ARROW} />
          </svg>
        </button>
      </div>

      {/* «Все новости» — только на мобиле (на десктопе ссылка в хедере секции) */}
      <a
        href="/news"
        className="hidden w-full items-center justify-center gap-[10px] bg-accent px-4 py-3 text-center font-display text-base font-semibold text-white transition hover:opacity-90 active:scale-[0.98] max-lg:mt-8 max-lg:flex"
      >
        Все новости
      </a>
    </div>
  );
}
