// Рантайм полноэкранного меню (компонент Menu.astro). Только поведение —
// открытие/закрытие, Esc, блок скролла, фокус и tab-trap; вся анимация в CSS
// (global.css), здесь лишь переключаются классы (.is-open на оверлее,
// .menu-open на <html> для блокировки скролла, включая Lenis — как html.loading).
//
// Lifecycle как у smooth.ts/loader.ts: при <ClientRouter /> скрипты не
// перезапускаются на навигации, поэтому слушатели вешаем на astro:page-load и
// снимаем на astro:before-swap (иначе утекут / .menu-open зависнет на новой странице).

const SELECTOR_FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

let teardown: (() => void) | null = null;

function init() {
  const root = document.documentElement;
  const overlay = document.querySelector<HTMLElement>("[data-menu]");
  if (!overlay) return;

  // aria-expanded синхронизируем перебором свежих триггеров (бургер живёт в
  // React-острове и теоретически может пересоздаться при гидратации).
  const setExpanded = (v: boolean) =>
    document
      .querySelectorAll<HTMLElement>("[data-menu-open]")
      .forEach((el) => el.setAttribute("aria-expanded", String(v)));

  // Элемент, на который вернём фокус после закрытия (обычно — бургер).
  let lastFocused: HTMLElement | null = null;

  const isOpen = () => overlay.classList.contains("is-open");

  const open = () => {
    if (isOpen()) return;
    lastFocused = document.activeElement as HTMLElement | null;
    overlay.classList.add("is-open");
    root.classList.add("menu-open");
    setExpanded(true);
    // Фокус на первый интерактивный элемент (крестик), чтобы Esc/таб работали сразу.
    overlay.querySelector<HTMLElement>(SELECTOR_FOCUSABLE)?.focus();
  };

  const close = () => {
    if (!isOpen()) return;
    overlay.classList.remove("is-open");
    root.classList.remove("menu-open");
    setExpanded(false);
    lastFocused?.focus();
  };

  // Делегирование на document: триггер бургера живёт в React-острове, прямой
  // слушатель на узле мог бы «отвалиться» при гидратации/пересборке DOM.
  const onDocClick = (e: Event) => {
    const opener = (e.target as HTMLElement).closest("[data-menu-open]");
    if (!opener) return;
    e.preventDefault();
    open();
  };

  // Esc закрывает; Tab — простой trap (цикл первый↔последний внутри оверлея).
  const onKeydown = (e: KeyboardEvent) => {
    if (!isOpen()) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(
      overlay.querySelectorAll<HTMLElement>(SELECTOR_FOCUSABLE),
    ).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Клик по ссылке внутри меню — закрываем (навигация/якорь произойдёт сама).
  const onOverlayClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-menu-close]")) {
      close();
      return;
    }
    if (target.closest("a[href]")) close();
  };

  document.addEventListener("click", onDocClick);
  overlay.addEventListener("click", onOverlayClick);
  document.addEventListener("keydown", onKeydown);

  teardown = () => {
    document.removeEventListener("click", onDocClick);
    overlay.removeEventListener("click", onOverlayClick);
    document.removeEventListener("keydown", onKeydown);
    // Снять возможный блок скролла, чтобы он не утёк на следующую страницу.
    root.classList.remove("menu-open");
    teardown = null;
  };
}

function destroy() {
  teardown?.();
}

document.addEventListener("astro:page-load", init);
document.addEventListener("astro:before-swap", destroy);
