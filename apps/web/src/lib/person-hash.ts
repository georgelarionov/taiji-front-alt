import { useEffect } from "react";

// Адрес ↔ панель «Подробнее» человека: «Команда» на /society и /taijiquan/person.
// #<слаг> в адресе открывает панель (прямой заход, переход по ссылке из новости,
// ссылка на той же странице); открытая кликом панель пишет свой слаг в адрес — им
// можно поделиться; закрытая — убирает якорь. Слаг = id человека (см. lib/cms).

// replaceState, а не pushState: отдельная запись истории потребовала бы закрывать
// панель по «Назад», а popstate под <ClientRouter /> разбирает он сам как свои
// переходы. Его history.state (индекс, позиция скролла) сохраняем как есть.
export function setPersonHash(id: string | null) {
  const url = id ? `#${encodeURIComponent(id)}` : location.pathname + location.search;
  history.replaceState(history.state, "", url);
}

// Якорь, которому не соответствует ни один человек (#team, #partners), пропускаем —
// это обычная прокрутка к секции. triggerAttr — атрибут кнопок «Подробнее» в сетке.
export function usePersonFromHash(
  people: { id: string }[],
  open: (id: string) => void,
  triggerAttr: string,
) {
  useEffect(() => {
    const openFromHash = () => {
      let id: string;
      try {
        id = decodeURIComponent(location.hash.slice(1));
      } catch {
        return; // битый %-escape в адресе
      }
      if (!people.some((p) => p.id === id)) return;
      // Фокус — на видимую кнопку этого человека ДО открытия: Drawer запомнит её как
      // триггер и вернёт на неё фокус при закрытии, а браузер докрутит к ней страницу.
      // В мобильном слайдере карточки может не быть — тогда панель просто открывается.
      const trigger = Array.from(document.querySelectorAll<HTMLElement>(`[${triggerAttr}]`)).find(
        (el) => el.getAttribute(triggerAttr) === id && el.getClientRects().length > 0,
      );
      trigger?.focus();
      open(id);
    };

    // Прямой заход с заставкой (html.loading): ждём её ухода, как HeroSlider, —
    // иначе панель въедет невидимо под ней.
    if (document.documentElement.classList.contains("loading")) {
      document.addEventListener("taiji:loader-done", openFromHash, { once: true });
    } else {
      openFromHash();
    }
    window.addEventListener("hashchange", openFromHash);
    // Ссылка на человека с той же страницы: ClientRouter меняет адрес через
    // pushState и шлёт popstate, а hashchange при этом не приходит.
    window.addEventListener("popstate", openFromHash);
    return () => {
      document.removeEventListener("taiji:loader-done", openFromHash);
      window.removeEventListener("hashchange", openFromHash);
      window.removeEventListener("popstate", openFromHash);
    };
  }, [people, open, triggerAttr]);
}
