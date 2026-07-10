import { useEffect, useState, type ReactNode } from "react";
import Drawer from "../Drawer";

// Дровер-хаб первой конференции (Москва, декабрь 2025) на странице /research.
// Открывается по клику на карточку конференции (триггер [data-conference-open]).
// Использует общий Drawer (правая панель + скролл). Внутри — 4 блока:
//   • Новости      — ссылки на уже существующие статьи ленты (/news/<slug>);
//   • Документы    — заглушка «Скоро» (структура появится позже, как в /society);
//   • Трансляция   — переход в видеоархив: /media-archive#video-<id> — там дровер
//                    с записью открывается сам (см. MediaArchive: диплинк по хэшу);
//   • Публикации   — заглушка «Скоро».

type NewsLink = { date: string; title: string; href: string };

type Props = {
  title: string;
  place: string;
  news: NewsLink[];
  broadcastHref: string;
};

// Делегированный click-листенер — ОДИН раз на модуль-левел (как в ContactFormDrawer /
// MembershipFormDrawer / menu.ts): document переживает SPA-свопы, а cleanup
// React-эффекта при свопе может не сработать → листенер бы накапливался.
let pendingOpen: (() => void) | null = null;
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const trigger = (e.target as HTMLElement).closest?.("[data-conference-open]");
    if (!trigger) return;
    e.preventDefault();
    pendingOpen?.();
  });
}

const ArrowIcon = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-display text-lg font-semibold text-ink max-lg:text-base">
      {children}
    </h3>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-[2px] border border-dashed border-border px-6 py-10 text-center">
      <p className="text-body text-ink/50">{text}</p>
    </div>
  );
}

export default function ConferenceDrawer({ title, place, news, broadcastHref }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    pendingOpen = () => setOpen(true);
    return () => {
      pendingOpen = null;
    };
  }, []);

  return (
    <Drawer open={open} onClose={() => setOpen(false)} label={title}>
      {/* Шапка */}
      <span className="text-eyebrow text-accent">{place}</span>
      <h2 className="mt-3 font-serif text-[32px] font-semibold leading-[1.2] text-ink max-lg:text-[24px]">
        {title}
      </h2>

      <div className="mt-9 flex flex-col gap-10 max-lg:mt-7 max-lg:gap-8">
        {/* Новости */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Новости</SectionHeading>
          <div className="flex flex-col gap-3">
            {news.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="group flex items-center justify-between gap-4 border border-border p-4 transition-colors hover:border-ink/40"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-display text-xs font-semibold text-ink/45">
                    {n.date}
                  </span>
                  <span className="font-display text-[15px] font-semibold leading-snug text-ink">
                    {n.title}
                  </span>
                </span>
                <ArrowIcon className="h-5 w-5 shrink-0 text-ink/35 transition-colors group-hover:text-accent" />
              </a>
            ))}
          </div>
        </section>

        {/* Трансляция → видеоархив (дровер с записью открывается на той странице) */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Трансляция</SectionHeading>
          <a
            href={broadcastHref}
            className="group flex items-center justify-between gap-4 border border-border bg-surface p-5 transition-colors hover:border-accent"
          >
            <span className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="flex flex-col">
                <span className="font-display text-[15px] font-semibold text-ink">
                  Видеозапись конференции
                </span>
                <span className="font-sans text-sm text-ink/55">
                  Открыть запись трансляции в видеоархиве
                </span>
              </span>
            </span>
            <ArrowIcon className="h-5 w-5 shrink-0 text-ink/35 transition-colors group-hover:text-accent" />
          </a>
        </section>

        {/* Документы (заглушка — структура как в /society появится позже) */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Документы</SectionHeading>
          <Placeholder text="Документы появятся здесь позже" />
        </section>

        {/* Публикации (заглушка) */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Публикации</SectionHeading>
          <Placeholder text="Публикации появятся здесь позже" />
        </section>
      </div>
    </Drawer>
  );
}
