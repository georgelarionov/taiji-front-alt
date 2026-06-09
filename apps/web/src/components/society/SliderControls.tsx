import { ARROW_PATH } from "../../lib/icons";

// Контролы карусели (стрелки + точки) — общие для мобильных слайдеров /society
// (ценности, команда). Точки по конвенции: активная w-[65px], неактивная w-6
// opacity-35. Стрелки тусклеют на краях (disabled). Ряд центрирован (как в макете).
type Props = {
  index: number;
  count: number;
  label: string; // для aria точек: «<label> N»
  onPrev: () => void;
  onNext: () => void;
  onSelect: (i: number) => void;
};

export default function SliderControls({ index, count, label, onPrev, onNext, onSelect }: Props) {
  const atStart = index === 0;
  const atEnd = index === count - 1;
  return (
    <div className="flex items-center justify-center gap-[46px]">
      <button
        type="button"
        onClick={onPrev}
        disabled={atStart}
        aria-label="Предыдущий"
        className={`grid h-11 w-11 rotate-180 cursor-pointer place-items-center text-ink transition disabled:cursor-default ${
          atStart ? "opacity-30" : "hover:opacity-60"
        }`}
      >
        <svg viewBox="0 0 16 15.5563" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d={ARROW_PATH} />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`${label} ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            className="flex h-11 cursor-pointer items-center"
          >
            <span
              className={`h-1 rounded-full bg-ink transition-all duration-300 ${
                i === index ? "w-[65px]" : "w-6 opacity-35 hover:opacity-60"
              }`}
            />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={atEnd}
        aria-label="Следующий"
        className={`grid h-11 w-11 cursor-pointer place-items-center text-ink transition disabled:cursor-default ${
          atEnd ? "opacity-30" : "hover:opacity-60"
        }`}
      >
        <svg viewBox="0 0 16 15.5563" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d={ARROW_PATH} />
        </svg>
      </button>
    </div>
  );
}
