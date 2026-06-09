import { useRef, useState } from "react";
import { useSwipe } from "../../lib/useSwipe";
import SliderControls from "./SliderControls";

// Мобильный слайдер «ценностей» /society (десктоп — статичная сетка 3×2 в
// SocietyMission.astro). Одна карточка + контролы; свайп пальцем переключает.
export type SocietyValue = { title: string; description: string };

export default function SocietyValuesSlider({ values }: { values: SocietyValue[] }) {
  const [index, setIndex] = useState(0);
  const n = values.length;
  const v = values[index];
  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(n - 1, i + 1));

  const rootRef = useRef<HTMLDivElement>(null);
  useSwipe(rootRef, { onLeft: next, onRight: prev });

  return (
    <div
      ref={rootRef}
      role="group"
      aria-roledescription="карусель"
      aria-label="Ценности"
      className="flex touch-pan-y flex-col gap-10"
    >
      {/* aria-live на стабильной обёртке; key={index} ремонтирует только внутренний
          article (фейд) → смена слайда корректно объявляется скринридером. */}
      <div aria-live="polite" aria-atomic="true">
        <article
          key={index}
          className="flex min-h-[214px] flex-col gap-4 border border-border p-6 animate-[fade-in_0.35s_ease_both] motion-reduce:animate-none"
        >
          <h3 className="font-display text-[21px] font-semibold leading-tight text-ink">{v.title}</h3>
          <p className="font-sans text-[15px] leading-normal text-ink/80">{v.description}</p>
        </article>
      </div>

      <SliderControls
        index={index}
        count={n}
        label="Ценность"
        onPrev={prev}
        onNext={next}
        onSelect={setIndex}
      />
    </div>
  );
}
