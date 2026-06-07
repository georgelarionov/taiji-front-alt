import { useRef, useState } from "react";
import { useSwipe } from "../lib/useSwipe";

// Правый слайдер 5-блока «Об Обществе»: меняет весь контент белой области
// (фото + текст персоны + цитата). Стрелки/точки переключают слайды.
// Подложка (surface-квадрат 48×48) — на активной «основной» стрелке: вперёд,
// пока не последний слайд; на последнем слайде она переезжает на «назад», а
// «вперёд» гаснет. Disabled-стрелка — тусклая и без подложки. Обе стрелки
// держат единый бокс 48×48, поэтому при «переезде» подложки ряд не дёргается.

export type SocietySlide = {
  role: string;
  name: string;
  title: string;
  bio: string;
  quote: string;
  photo: string; // оптимизированный src (getImage в Society.astro)
};

const ARROW =
  "M12.1716 6.77822l-5.364-5.36401 1.4142-1.41421 7.7782 7.77822-7.7782 7.7781-1.4142-1.4142 5.364-5.3639-12.1716 0 0-2 12.1716 0z";

export default function SocietySlider({ slides }: { slides: SocietySlide[] }) {
  const [index, setIndex] = useState(0);
  const n = slides.length;
  const s = slides[index];
  const atStart = index === 0;
  const atEnd = index === n - 1;
  const nextSlide = atEnd ? null : slides[index + 1]; // превью для hover на «вперёд»
  const prevSlide = atStart ? null : slides[index - 1]; // превью для hover на «назад»
  const prev = () => setIndex((v) => Math.max(0, v - 1));
  const next = () => setIndex((v) => Math.min(n - 1, v + 1));

  // Свайп пальцем по карточке (мобайл): влево → следующий, вправо → предыдущий.
  const rootRef = useRef<HTMLDivElement>(null);
  useSwipe(rootRef, { onLeft: next, onRight: prev });

  return (
    <div
      ref={rootRef}
      className="flex h-full touch-pan-y flex-col bg-white p-12 max-lg:p-6"
    >
      {/* Сменяемый контент (фейд по смене слайда) */}
      <div
        key={index}
        style={{ animation: "fade-in 0.35s ease both" }}
        className="flex flex-col gap-9 max-lg:gap-7"
      >
        {/* Карточка персоны: на мобиле (<lg) фото и текст в столбик */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Фото персоны (190×254 в PEN); object-cover — портрет точно по боксу */}
          <img
            src={s.photo}
            alt={s.name}
            width={190}
            height={254}
            className="h-[254px] w-full shrink-0 object-cover max-lg:order-2 max-lg:h-auto max-lg:object-contain lg:w-[190px]"
          />
          {/* На мобиле textCol раскрывается (display:contents) → роль/ФИО и
              должность/био становятся прямыми детьми карточки, и через order
              выстраиваются: роль+ФИО → фото → остальное. Десктоп не меняется. */}
          <div className="flex flex-col gap-5 max-lg:contents">
            <div className="flex flex-col gap-3.5 max-lg:order-1 max-lg:gap-3">
              <p className="font-display text-sm font-bold tracking-[-0.14px] text-accent max-lg:text-[13px]">
                {s.role}
              </p>
              <p className="font-serif text-[39px] font-semibold leading-none text-ink max-lg:text-[28px] max-lg:leading-[1.05]">
                {s.name}
              </p>
            </div>
            <div className="flex flex-col gap-3 max-lg:order-3">
              <p className="font-display text-base font-semibold tracking-[-0.16px] text-ink max-lg:text-[15px]">
                {s.title}
              </p>
              <div className="h-px w-full bg-black/15"></div>
              <p className="font-display text-base font-semibold tracking-[-0.16px] text-ink max-lg:text-[15px]">
                {s.bio}
              </p>
            </div>
          </div>
        </div>

        {/* Приветственная цитата */}
        <div className="flex flex-col gap-4 max-lg:gap-3">
          <p className="font-serif text-xl font-semibold text-ink/50 max-lg:text-lg">
            Приветственная цитата:
          </p>
          <blockquote className="border border-black/15 py-6 pl-6 pr-9 font-sans text-base font-medium leading-[1.375] text-ink max-lg:p-5 max-lg:text-[14px]">
            {s.quote}
          </blockquote>
        </div>
      </div>

      {/* Нижний ряд: «Подробнее» + контролы слайдера (фиксированный).
          На мобиле: CTA на всю ширину, контролы под ней. */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-6 pt-9 max-lg:mt-6 max-lg:pt-6">
        <a
          href="#"
          className="inline-flex w-[200px] items-center justify-center bg-accent px-8 py-4 font-display text-base font-semibold text-white transition hover:opacity-90 active:scale-[0.98] max-lg:w-full"
        >
          Подробнее
        </a>

        <div className="flex items-center gap-6 max-lg:w-full max-lg:justify-between">
          {/* Стрелка «назад» + hover-превью предыдущего слайда (зеркало превью
              «вперёд»). На первом слайде превью нет (prevSlide === null). */}
          <div className="relative">
            <button
              type="button"
              onClick={prev}
              disabled={atStart}
              aria-label="Предыдущий"
              className={`peer grid h-12 w-12 rotate-180 cursor-pointer place-items-center rounded-sm text-ink transition disabled:cursor-default enabled:active:scale-95 ${
                atStart
                  ? "opacity-30"
                  : atEnd
                    ? "bg-surface-sunken hover:opacity-70"
                    : "hover:opacity-60"
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

            {prevSlide && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-full z-10 mt-4 w-max max-w-[80vw] origin-top-left -translate-y-1 scale-95 opacity-0 transition-all duration-200 ease-out peer-hover:translate-y-0 peer-hover:scale-100 peer-hover:opacity-100 peer-focus-visible:translate-y-0 peer-focus-visible:scale-100 peer-focus-visible:opacity-100"
              >
                <div className="rounded-[1px] border border-black/5 bg-surface px-6 py-5 shadow-[0_20px_45px_-15px_rgba(13,16,20,0.25)]">
                  <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-accent">
                    {prevSlide.role}
                  </p>
                  <p className="mt-1.5 whitespace-nowrap font-serif text-[22px] font-semibold leading-tight text-ink">
                    {prevSlide.name}
                  </p>
                </div>
              </div>
            )}
          </div>

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
                  className={`h-1 rounded-full bg-ink transition-all duration-300 ${
                    i === index ? "w-[65px]" : "w-6 opacity-35 hover:opacity-60"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Стрелка «следующий» + hover-превью следующего слайда (роль + имя).
              Кнопка несёт класс `peer`, карточка-превью раскрывается по
              peer-hover/peer-focus-visible. На последнем слайде превью нет. */}
          <div className="relative">
            <button
              type="button"
              onClick={next}
              disabled={atEnd}
              aria-label="Следующий"
              className={`peer grid h-12 w-12 cursor-pointer place-items-center rounded-sm text-ink transition disabled:cursor-default enabled:active:scale-95 ${
                atEnd ? "opacity-30" : "bg-surface-sunken hover:opacity-70"
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

            {nextSlide && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-full z-10 mt-4 w-max max-w-[80vw] origin-top-right -translate-y-1 scale-95 opacity-0 transition-all duration-200 ease-out peer-hover:translate-y-0 peer-hover:scale-100 peer-hover:opacity-100 peer-focus-visible:translate-y-0 peer-focus-visible:scale-100 peer-focus-visible:opacity-100"
              >
                <div className="rounded-[1px] border border-black/5 bg-surface px-6 py-5 shadow-[0_20px_45px_-15px_rgba(13,16,20,0.25)]">
                  <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-accent">
                    {nextSlide.role}
                  </p>
                  <p className="mt-1.5 whitespace-nowrap font-serif text-[22px] font-semibold leading-tight text-ink">
                    {nextSlide.name}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
