import { useRef, useState } from "react";
import { useSwipe } from "../../lib/useSwipe";
import SliderControls from "./SliderControls";

// Мобильный слайдер «Команды» /society (десктоп — сетка 4-кол в SocietyTeam.astro).
// Одна карточка персоны + контролы; свайп переключает. Портрет — оптимизированный
// webp-src, подготовленный в SocietyTeam.astro через getImage().
export type SocietyMember = { role: string; name: string; photo: string };

export default function SocietyTeamSlider({ members }: { members: SocietyMember[] }) {
  const [index, setIndex] = useState(0);
  const n = members.length;
  const m = members[index];
  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(n - 1, i + 1));

  const rootRef = useRef<HTMLDivElement>(null);
  useSwipe(rootRef, { onLeft: next, onRight: prev });

  return (
    <div
      ref={rootRef}
      role="group"
      aria-roledescription="карусель"
      aria-label="Команда"
      className="flex touch-pan-y flex-col gap-10"
    >
      {/* aria-live на стабильной обёртке; key={index} ремонтирует только внутренний
          article (фейд) → смена слайда корректно объявляется скринридером. */}
      <div aria-live="polite" aria-atomic="true">
        <article
          key={index}
          className="flex flex-col gap-6 bg-white p-7 animate-[fade-in_0.35s_ease_both] motion-reduce:animate-none"
        >
          <img
            src={m.photo}
            alt=""
            width={111}
            height={150}
            loading="lazy"
            decoding="async"
            className="h-[150px] w-[111px] object-cover"
          />
          <div className="flex flex-col gap-3">
            <span className="font-display text-sm font-bold uppercase tracking-[-0.14px] text-accent">
              {m.role}
            </span>
            <h3 className="font-display text-2xl font-semibold leading-[1.3] text-ink">{m.name}</h3>
          </div>
          <a
            href="#"
            className="flex items-center justify-center bg-accent-soft py-3 font-display text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
          >
            Подробнее
          </a>
        </article>
      </div>

      <SliderControls
        index={index}
        count={n}
        label="Персона"
        onPrev={prev}
        onNext={next}
        onSelect={setIndex}
      />
    </div>
  );
}
