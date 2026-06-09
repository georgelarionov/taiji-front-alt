import { useState } from "react";
import type { MediaVideo, MediaPhoto, VideoFilter } from "../../data/media";
import Drawer from "../Drawer";

// Медиа-архив (/media-archive): табы Видео/Фото + фильтр категорий + сетки
// карточек; клик по карточке открывает общий правый дровер (Drawer) с медиа.
// Остров client:load — всё состояние интерактивно. Контент дровера — заглушка
// (CMS позже). Типографика — по тип-шкале проекта.

type Props = {
  videos: MediaVideo[];
  photos: MediaPhoto[];
  filters: VideoFilter[];
};
type OpenItem = { kind: "video" | "photo"; title: string; date: string };

/* ----------------------------------- иконки (outline, currentColor) -------- */
const PlayIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const ImageIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="1" /><circle cx="9" cy="9" r="1.8" /><path d="m21 15-4.5-4.5L6 21" />
  </svg>
);

export default function MediaArchive({ videos, photos, filters }: Props) {
  const [tab, setTab] = useState<"video" | "photo">("video");
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState<OpenItem | null>(null);

  const shownVideos = filter ? videos.filter((v) => v.category === filter) : videos;

  // Список вкладок (для стрелочной навигации roving-tabindex).
  const TABS = [
    ["video", "Видео"],
    ["photo", "Фото"],
  ] as const;

  // Смена вкладки. Уходя с «Видео» сбрасываем фильтр категорий — иначе при
  // возврате грид молча показывает подвыборку при невидимых кнопках фильтра.
  function selectTab(id: "video" | "photo") {
    setTab(id);
    if (id === "photo") setFilter(null);
  }

  return (
    <div>
      {/* табы */}
      <div className="border-b border-border bg-white">
        <div className="container-block flex items-center gap-10 max-lg:gap-8" role="tablist" aria-label="Тип медиа">
          {TABS.map(([id, label], i) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`media-tab-${id}`}
                aria-selected={active}
                aria-controls="media-panel"
                tabIndex={active ? 0 : -1}
                onClick={() => selectTab(id)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length][0];
                  selectTab(next);
                  document.getElementById(`media-tab-${next}`)?.focus();
                }}
                className={`relative cursor-pointer py-5 font-display text-[17px] font-semibold transition-colors max-lg:py-4 max-lg:text-base ${
                  active ? "text-ink" : "text-ink/45 hover:text-ink/70"
                }`}
              >
                {label}
                {active && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* контент таба. tabIndex не ставим: панель содержит фокусируемые карточки-кнопки
          (по APG tabindex=0 нужен только когда в панели нет фокусируемых элементов). */}
      <section
        id="media-panel"
        role="tabpanel"
        aria-labelledby={`media-tab-${tab}`}
        className="bg-white py-16 max-lg:py-10"
      >
        <div className="container-block">
          {tab === "video" ? (
            <>
              <div className="flex items-end justify-between gap-8 max-lg:flex-col max-lg:items-start max-lg:gap-5">
                <h2 className="text-h2-compact text-ink">Видеоматериалы</h2>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 max-lg:gap-x-5">
                  {filters.map((f) => {
                    const active = filter === f.category;
                    return (
                      <button
                        key={f.label}
                        type="button"
                        onClick={() => setFilter(f.category)}
                        className={`cursor-pointer font-display text-[15px] font-semibold transition-colors ${
                          active ? "text-accent" : "text-ink/55 hover:text-ink"
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-x-8 gap-y-12 max-lg:mt-8 max-lg:grid-cols-1 max-lg:gap-y-8">
                {shownVideos.map((v) => (
                  <button key={v.id} type="button" onClick={() => setOpen({ kind: "video", title: v.title, date: v.date })} className="group flex cursor-pointer flex-col text-left">
                    <div className="flex aspect-video w-full items-center justify-center bg-surface-sunken transition-colors group-hover:bg-field">
                      <PlayIcon className="h-12 w-12 text-ink/35" />
                    </div>
                    <div className="mt-4 flex items-center gap-3 font-display text-sm">
                      <span className="font-semibold text-ink/70">{v.category}</span>
                      <span className="h-1 w-1 rounded-full bg-ink/30" aria-hidden="true" />
                      <span className="text-ink/45">{v.date}</span>
                    </div>
                    <h3 className="mt-2 text-h3 text-ink">{v.title}</h3>
                    <p className="mt-2 font-sans text-base leading-relaxed text-ink/65">{v.desc}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-h2-compact text-ink">Фотогалереи</h2>

              <div className="mt-10 grid grid-cols-3 gap-8 max-lg:mt-8 max-lg:grid-cols-1">
                {photos.map((p) => (
                  <button key={p.id} type="button" onClick={() => setOpen({ kind: "photo", title: p.title, date: p.meta })} className="group flex cursor-pointer flex-col text-left">
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-surface-sunken transition-colors group-hover:bg-field">
                      <ImageIcon className="h-12 w-12 text-ink/30" />
                    </div>
                    <h3 className="mt-4 text-h3 text-ink">{p.title}</h3>
                    <p className="mt-2 font-display text-sm font-semibold text-ink/50">{p.meta}</p>
                    <p className="mt-2 font-sans text-base leading-relaxed text-ink/65">{p.desc}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* дровер с медиа (общий компонент) */}
      <Drawer open={!!open} onClose={() => setOpen(null)} label={open?.title}>
        {open && (
          <>
            <h2 className="font-serif text-[34px] font-semibold leading-[1.15] text-ink max-lg:text-[26px]">{open.title}</h2>
            <p className="mt-3 font-serif text-lg italic text-ink/55 max-lg:text-base">{open.date} г.</p>

            {/* медиа: видео → чёрный плеер с лоудером; фото → плейсхолдер */}
            {open.kind === "video" ? (
              <div className="mt-8 flex aspect-video w-full items-center justify-center bg-black max-lg:mt-5">
                <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" aria-hidden="true" />
              </div>
            ) : (
              <div className="mt-8 flex aspect-[4/3] w-full items-center justify-center bg-surface-sunken max-lg:mt-5" aria-hidden="true">
                <ImageIcon className="h-14 w-14 text-ink/30" />
              </div>
            )}

            {/* переключатель языка */}
            <div className="mt-4 flex items-center gap-4">
              <a href="#" lang="zh-Hans" className="font-sans text-base text-accent underline underline-offset-2">中文</a>
              <a href="#" className="font-sans text-base text-accent underline underline-offset-2">English</a>
            </div>

            {/* описание (заглушка) */}
            <div className="mt-5 flex flex-col gap-4 font-sans text-[17px] leading-[1.7] text-ink/80 max-lg:text-base">
              <p>Что привлекает людей в тайцзицюань? Как принципы этого спорта помогают вести переговоры и принимать взвешенные решения в бизнесе?</p>
              <p>Об этом и не только — в <a href="#" className="text-accent underline underline-offset-2">BRICSтервью</a> ответственного секретаря Общества изучения традиционного тайцзицюань Дмитрия Петровского.</p>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
