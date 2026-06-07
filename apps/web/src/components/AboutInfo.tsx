import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

// Текст справки — русский с вкраплениями китайских иероглифов (太極拳 / 太极拳).
// Оборачиваем каждый CJK-прогон в <span lang=…>, чтобы скринридер переключил
// голос/словарь на китайский. Традиционные формы (содержащие 極/體/… — здесь 極)
// помечаем zh-Hant, остальные CJK — zh-Hans (упрощённые). Деление — по прогонам
// иероглифов (U+3400–U+9FFF), русские/латинские фрагменты остаются как есть.
const CJK_SPLIT = /([㐀-鿿]+)/g; // делим строку, захватывая CJK-прогоны
const IS_CJK = /[㐀-鿿]/; // membership-тест (без /g — без stateful lastIndex)
const TRAD_ONLY = /[極]/; // 極 — традиционный знак (упр. 极)
function renderWithLang(text: string) {
  return text.split(CJK_SPLIT).map((part, i) =>
    IS_CJK.test(part) ? (
      <span key={i} lang={TRAD_ONLY.test(part) ? "zh-Hant" : "zh-Hans"}>
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

// Хедер-плашка 2-блока «О тайцзицюань»: вся surface-плашка (лого + «ПОДРОБНЕЕ ⓘ») —
// одна кнопка. По клику снизу у правого края всплывает контекстное окно-справка
// (мягкая тень, ×, текст Inter 15px, ссылка «Подробнее»). Закрывается по ×,
// клику вне и Escape. Остров, т.к. поведение интерактивное (client:load).

type Props = {
  /** Каллиграфия 太極拳 — резолвится из Astro <Image import>, передаём .src/.width/.height */
  logoSrc: string;
  logoWidth: number;
  logoHeight: number;
  logoAlt: string;
  /** path d иконки ⓘ (viewBox 0 0 20 20) */
  infoIcon: string;
  /** Текст справки в окне */
  text: string;
  /** Ссылка «Подробнее» (плейсхолдер до CMS) */
  moreHref?: string;
};

export default function AboutInfo({
  logoSrc,
  logoWidth,
  logoHeight,
  logoAlt,
  infoIcon,
  text,
  moreHref = "#",
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне окна и по Escape (только пока окно открыто).
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative max-lg:w-full">
      {/* Вся плашка — кнопка. На мобиле — full-width, rounded-br-2xl сохраняем */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="about-info-popover"
        className="group block w-full cursor-pointer rounded-br-2xl bg-surface py-4 pl-6 pr-[18px] text-left lg:w-auto"
      >
        <span className="flex w-[377px] items-center justify-between gap-6 max-lg:w-full">
          <img
            src={logoSrc}
            width={logoWidth}
            height={logoHeight}
            alt={logoAlt}
            className="h-10 w-auto shrink-0 object-contain max-lg:h-8"
          />
          {/* gap текст↔иконка: десктоп 12px, мобила 16px (по фидбэку — больше) */}
          <span className="flex items-center gap-3 max-lg:gap-4">
            <span className="relative font-display text-sm font-bold leading-[1.2] text-ink/70 transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-center after:scale-x-0 after:bg-ink after:transition-transform after:duration-300 after:content-[''] group-hover:text-ink group-hover:after:scale-x-100">
              ПОДРОБНЕЕ
            </span>
            <svg
              viewBox="0 0 20 20"
              className="h-[23px] w-[23px] shrink-0 text-ink"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d={infoIcon} />
            </svg>
          </span>
        </span>
      </button>

      {/* Контекстное окно-справка */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="about-info-popover"
            role="dialog"
            aria-label="О тайцзицюань — справка"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.54, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-0 z-50 w-[440px] max-w-[calc(100vw-30px)] border border-border bg-white p-7 shadow-popover max-lg:left-0 max-lg:top-full max-lg:right-0 max-lg:w-full max-lg:max-w-none max-lg:mt-1"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Закрыть"
              className="absolute right-5 top-5 cursor-pointer text-ink/35 transition-colors hover:text-ink/70"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>

            <p className="pr-8 font-sans text-[17px] leading-[1.5] text-ink">
              {renderWithLang(text)}
            </p>

            <a
              href={moreHref}
              className="mt-6 inline-block font-sans text-[17px] font-medium text-accent transition-opacity hover:opacity-70"
            >
              Подробнее
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
