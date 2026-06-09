import { useEffect, useState, type ReactNode } from "react";
import Drawer from "../Drawer";
import type { HistoryEntry, TeamBio } from "../../data/society-team";

// Дровер «Подробнее» блока «Команда» (/society). Открывается по клику на любой
// триггер [data-team-open="<id>"] в статической сетке (SocietyTeam.astro) и в
// мобильном слайдере (SocietyTeamSlider.tsx). Использует общий Drawer (правая
// панель + скролл контента). Структура: фото + роль/имя → «Описание» →
// «Биография» (пункты, у Марченко — вложенный список). Текст хранится в
// src/data/society-team.ts. Фото (большой webp) подмешивается в SocietyTeam.astro.

export type DrawerPerson = TeamBio & { photo: string };

// Делегированный click-листенер вешаем ОДИН раз на модуль-левел (как в
// ContactFormDrawer / menu.ts): document переживает SPA-свопы, а cleanup
// React-эффекта при свопе может не сработать → листенер бы накапливался.
let pendingOpen: ((id: string) => void) | null = null;
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const trigger = (e.target as HTMLElement).closest?.("[data-team-open]");
    if (!trigger) return;
    e.preventDefault();
    pendingOpen?.(trigger.getAttribute("data-team-open") || "");
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

function HistoryItem({ entry }: { entry: HistoryEntry }) {
  const text = typeof entry === "string" ? entry : entry.text;
  const sub = typeof entry === "string" ? null : entry.items;
  return (
    <li className="flex flex-col gap-3">
      <div className="flex gap-3">
        <span
          className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent max-lg:mt-2"
          aria-hidden="true"
        />
        <p className="text-body text-ink/80">{renderText(text)}</p>
      </div>
      {sub && (
        <ul className="ml-6 flex flex-col gap-2.5 max-lg:ml-4">
          {sub.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-accent/50"
                aria-hidden="true"
              />
              <p className="text-body text-ink/70">{renderText(s)}</p>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function SocietyTeamDrawer({ people }: { people: DrawerPerson[] }) {
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
          {/* шапка: портрет + роль/имя */}
          <div className="flex gap-7 max-lg:flex-col max-lg:gap-5">
            <img
              src={person.photo}
              alt={person.name}
              width={222}
              height={300}
              loading="lazy"
              decoding="async"
              className="h-[300px] w-[222px] shrink-0 object-cover object-top max-lg:h-[320px] max-lg:w-full max-lg:max-w-[260px]"
            />
            <div className="flex flex-col gap-3 pt-1">
              <span className="text-eyebrow text-accent">{person.role}</span>
              <h2 className="font-serif text-[34px] font-semibold leading-[1.15] text-ink max-lg:text-[26px]">
                {person.name}
              </h2>
            </div>
          </div>

          {/* Описание */}
          <section className="flex flex-col gap-3">
            <h3 className="text-eyebrow text-ink/45">Описание</h3>
            {person.description.map((p, i) => (
              <p key={i} className="text-body text-ink/80">
                {renderText(p)}
              </p>
            ))}
          </section>

          {/* Биография (пункты) */}
          <section className="flex flex-col gap-4">
            <h3 className="text-eyebrow text-ink/45">Биография</h3>
            <ul className="flex flex-col gap-4">
              {person.history.map((entry, i) => (
                <HistoryItem key={i} entry={entry} />
              ))}
            </ul>
          </section>
        </div>
      )}
    </Drawer>
  );
}
