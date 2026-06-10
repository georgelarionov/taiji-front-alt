import { useRef, useState } from "react";

// Табы «Предстоящие / Прошедшие» страницы /events (фреймы Events / Eventsmobile).
// Пока страница — заглушка: под табами показывается пустое состояние (списки
// мероприятий придут из CMS). Остров client:load — нужен runtime (переключение
// таба). Доступность: role=tablist/tab/tabpanel, aria-selected, навигация
// стрелками ←/→ (roving tabindex). Размеры по фрейму: таб 40px (desktop) / 24px
// (mobile), активный — полная непрозрачность + синяя полоса снизу.

const TABS = [
  {
    id: "upcoming",
    label: "Предстоящие",
    empty: "Нет запланированных мероприятий",
  },
  {
    id: "past",
    label: "Прошедшие",
    empty: "Список прошедших мероприятий пуст",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function EventsTabs() {
  const [active, setActive] = useState<TabId>("upcoming");
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = TABS.find((t) => t.id === active)!;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const idx = TABS.findIndex((t) => t.id === active);
    const nextIdx =
      e.key === "ArrowRight"
        ? (idx + 1) % TABS.length
        : (idx - 1 + TABS.length) % TABS.length;
    setActive(TABS[nextIdx].id);
    btnRefs.current[nextIdx]?.focus();
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div
        role="tablist"
        aria-label="Мероприятия"
        className="flex items-end justify-center gap-16 max-lg:gap-8"
      >
        {TABS.map((t, i) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`events-tab-${t.id}`}
              aria-selected={isActive}
              aria-controls="events-panel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={onKeyDown}
              className={`relative cursor-pointer pb-4 font-display text-[40px] font-semibold leading-[1.1] text-ink transition-opacity max-lg:pb-3 max-lg:text-[24px] ${
                isActive ? "opacity-100" : "opacity-50 hover:opacity-70"
              }`}
            >
              {t.label}
              {/* Полоса под активным табом во всю ширину текста (≈7/3px по фрейму).
                  transform инлайном (не Tailwind-классом) — чтобы гарантированно
                  применялся; растёт из центра (origin-center). */}
              <span
                className="absolute inset-x-0 bottom-0 h-[7px] origin-center bg-accent transition-transform duration-300 ease-smooth max-lg:h-[3px]"
                style={{ transform: isActive ? "scaleX(1)" : "scaleX(0)" }}
              />
            </button>
          );
        })}
      </div>

      {/* Панель: пока пустое состояние (заглушка). Высокая — воздух как в макете
          (≈211px зазор + 365px низ). aria-live — объявляет смену. */}
      <div
        id="events-panel"
        role="tabpanel"
        aria-labelledby={`events-tab-${active}`}
        tabIndex={0}
        className="flex min-h-[520px] w-full items-center justify-center max-lg:min-h-[420px]"
      >
        <p
          aria-live="polite"
          className="px-4 text-center font-display text-lg font-semibold text-ink max-lg:text-base"
        >
          {current.empty}
        </p>
      </div>
    </div>
  );
}
