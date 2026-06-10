import { useState } from "react";
import type { MediaVideo } from "../../data/media";
import Drawer from "../Drawer";

// Медиа-архив (/media-archive): табы Видео/Фото. «Видео» — сетка карточек реальных
// материалов с сайта Общества (RuTube); клик открывает общий правый дровер (Drawer)
// с встроенным плеером + описанием. Фильтра категорий нет (на источнике его нет).
// «Фото» — пустое состояние «Материалы скоро появятся» (галереи придут позже/из CMS).
// Остров client:load — интерактивные табы и дровер. Типографика — по тип-шкале.

type Props = {
  videos: MediaVideo[];
};

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

export default function MediaArchive({ videos }: Props) {
  const [tab, setTab] = useState<"video" | "photo">("video");
  const [open, setOpen] = useState<MediaVideo | null>(null);

  // Список вкладок (для стрелочной навигации roving-tabindex).
  const TABS = [
    ["video", "Видео"],
    ["photo", "Фото"],
  ] as const;

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
                onClick={() => setTab(id)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length][0];
                  setTab(next);
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
              <h2 className="text-h2-compact text-ink">Видеоматериалы</h2>

              <div className="mt-10 grid grid-cols-3 gap-x-8 gap-y-12 max-lg:mt-8 max-lg:grid-cols-1 max-lg:gap-y-8">
                {videos.map((v) => (
                  <button key={v.id} type="button" onClick={() => setOpen(v)} className="group flex cursor-pointer flex-col text-left">
                    <div className="relative flex aspect-video w-full items-center justify-center bg-surface-sunken transition-colors group-hover:bg-field">
                      <PlayIcon className="h-12 w-12 text-ink/35" />
                      {v.embeds.length > 1 && (
                        <span className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-2.5 py-1 font-display text-xs font-semibold text-white">
                          {v.embeds.length} видео
                        </span>
                      )}
                    </div>
                    <p className="mt-4 font-display text-sm font-semibold text-ink/45">{v.date}</p>
                    <h3 className="mt-2 text-h3 text-ink">{v.title}</h3>
                    <p className="mt-2 line-clamp-3 font-sans text-base leading-relaxed text-ink/65">{v.desc[0]}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 py-10 text-center max-lg:min-h-[260px]">
              <ImageIcon className="h-12 w-12 text-ink/25" />
              <h2 className="text-h2-compact text-ink">Материалы скоро появятся</h2>
              <p className="max-w-[520px] font-sans text-base leading-relaxed text-ink/60 max-lg:text-[15px]">
                Фотогалереи Общества появятся в этом разделе в ближайшее время.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* дровер с видео (общий компонент): плеер(ы) RuTube + описание */}
      <Drawer open={!!open} onClose={() => setOpen(null)} label={open?.title}>
        {open && (
          <>
            <h2 className="font-serif text-[34px] font-semibold leading-[1.15] text-ink max-lg:text-[26px]">{open.title}</h2>
            <p className="mt-3 font-serif text-lg italic text-ink/55 max-lg:text-base">{open.date}</p>

            {/* плеер(ы): один или несколько роликов с подписями частей */}
            <div className="mt-8 flex flex-col gap-8 max-lg:mt-5 max-lg:gap-6">
              {open.embeds.map((e, i) => (
                <div key={i}>
                  {e.label && (
                    <p className="mb-3 font-display text-[15px] font-semibold text-ink/75">{e.label}</p>
                  )}
                  <div className="aspect-video w-full overflow-hidden bg-black">
                    <iframe
                      src={e.src}
                      title={e.label ?? open.title}
                      loading="lazy"
                      allow="clipboard-write; autoplay; fullscreen; picture-in-picture; encrypted-media"
                      allowFullScreen
                      className="h-full w-full border-0"
                      style={{ pointerEvents: "auto" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* описание */}
            <div className="mt-6 flex flex-col gap-4 font-sans text-[17px] leading-[1.7] text-ink/80 max-lg:text-base">
              {open.desc.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
