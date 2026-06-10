import { useEffect, useState, type ReactNode } from "react";
import Drawer from "../Drawer";
import type { PersonSource, TaijiPerson } from "../../data/taiji-persons";
import { EXTERNAL_ARROW_PATH } from "../../lib/icons";

// Дровер «Подробнее» раздела «Персоналии» (/taijiquan/person). Открывается по
// клику на любой триггер [data-person-open="<id>"] в статической сетке карточек
// (TaijiPersons.astro). Использует общий Drawer (правая панель + скролл). Структура:
// плейсхолдер портрета + линия/имя → мета (линия/годы/значение) → биография →
// ИСТОЧНИКИ (внутри дровера, не внизу страницы). Текст — src/data/taiji-persons.ts.

// Персона с уже разрешёнными источниками + портретом (резолвятся в TaijiPersons.astro).
export type DrawerPerson = TaijiPerson & {
  photo: string | null;
  sources: PersonSource[];
};

// Делегированный click-листенер один раз на модуль-левел (как SocietyTeamDrawer /
// ContactFormDrawer / menu.ts): document переживает SPA-свопы, cleanup
// React-эффекта при свопе может не сработать → листенер бы накапливался.
let pendingOpen: ((id: string) => void) | null = null;
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const trigger = (e.target as HTMLElement).closest?.("[data-person-open]");
    if (!trigger) return;
    e.preventDefault();
    pendingOpen?.(trigger.getAttribute("data-person-open") || "");
  });
}

// Иероглифы встречаются вкраплениями в русском тексте — оборачиваем CJK-прогоны
// (Han) в <span lang="zh-Hans"> для корректной озвучки/шрифта (a11y).
const CJK = /(\p{Script=Han}+)/gu;
function renderText(text: string): ReactNode {
  CJK.lastIndex = 0;
  if (!CJK.test(text)) return text;
  CJK.lastIndex = 0;
  return text.split(CJK).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} lang="zh-Hans">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

// Плейсхолдер портрета (картинок нет) — бокс bg-surface с иконкой.
function PortraitPlaceholder() {
  return (
    <div
      className="relative flex aspect-[3/4] w-[200px] shrink-0 items-center justify-center overflow-hidden bg-surface max-lg:w-full max-lg:max-w-[260px]"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-12 w-12 text-ink/25"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </svg>
      <span className="absolute left-3 top-3 font-display text-[12px] font-bold uppercase tracking-wide text-ink/40">
        Портрет
      </span>
    </div>
  );
}

export default function TaijiPersonsDrawer({ people }: { people: DrawerPerson[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    pendingOpen = (id) => setOpenId(id);
    return () => {
      pendingOpen = null;
    };
  }, []);

  const person = people.find((p) => p.id === openId) || null;

  return (
    <Drawer open={!!person} onClose={() => setOpenId(null)} label={person?.name}>
      {person && (
        <div className="flex flex-col gap-9 max-lg:gap-7">
          {/* Шапка: портрет (или плейсхолдер) + линия/имя */}
          <div className="flex gap-7 max-lg:flex-col max-lg:gap-5">
            {person.photo ? (
              <img
                src={person.photo}
                alt={`${person.name} — портрет`}
                loading="lazy"
                decoding="async"
                className="aspect-[3/4] w-[200px] shrink-0 bg-surface object-contain p-2 max-lg:w-full max-lg:max-w-[260px]"
              />
            ) : (
              <PortraitPlaceholder />
            )}
            <div className="flex flex-col gap-3 pt-1">
              <span className="text-eyebrow text-accent">{person.line}</span>
              <h2 className="font-serif text-[34px] font-semibold leading-[1.15] text-ink max-lg:text-[26px]">
                {person.name}{" "}
                <span lang="zh-Hans" className="font-medium text-ink/45">
                  {person.cjk}
                </span>
              </h2>
            </div>
          </div>

          {/* Мета: линия / годы / ключевое значение */}
          <dl className="flex flex-col gap-3 border-y border-border py-5">
            {person.meta.map((m, i) => (
              <div
                key={i}
                className="grid grid-cols-[160px_1fr] gap-4 max-lg:grid-cols-[120px_1fr] max-lg:gap-3"
              >
                <dt className="font-display text-sm font-semibold text-ink/45">
                  {m.label}
                </dt>
                <dd className="text-body text-ink/80">{m.value}</dd>
              </div>
            ))}
          </dl>

          {/* Биография */}
          <section className="flex flex-col gap-4">
            <h3 className="text-eyebrow text-ink/45">Биография</h3>
            {person.bio.map((p, i) => (
              <p key={i} className="text-body text-ink/80">
                {renderText(p)}
              </p>
            ))}
          </section>

          {/* Источники (внутри дровера) */}
          <section className="flex flex-col gap-4 border-t border-border pt-7">
            <h3 className="text-eyebrow text-ink/45">Источники</h3>
            <ol className="flex flex-col gap-5">
              {person.sources.map((s) => (
                <li key={s.n} className="grid grid-cols-[auto_1fr] gap-x-3">
                  <span
                    className="font-serif text-[18px] leading-none text-accent"
                    aria-hidden="true"
                  >
                    [{s.n}]
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-sans text-[14px] leading-relaxed text-ink/75">
                      <span className="font-semibold text-ink">{s.title}</span>{" "}
                      {s.desc}
                    </p>
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline inline-flex w-fit items-center gap-1 font-display text-sm font-semibold text-accent"
                      >
                        {s.label}
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d={EXTERNAL_ARROW_PATH} />
                        </svg>
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Drawer>
  );
}
