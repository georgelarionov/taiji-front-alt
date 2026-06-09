import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Общий правый дровер (медиа-архив, форма контактов — переиспользуется). Панель
// справа: 50% / min 900px (десктоп), во всю ширину (мобайл); фон затемняется.
// Рендерится через портал в <body> (вне #main), чтобы можно было выставить inert
// на #main и изолировать фон для скринридеров/фокуса — как делает меню. Блок
// скролла фона — класс html.drawer-open (overflow:hidden, как у меню; останавливает
// и Lenis). Esc и клик по подложке закрывают; фокус на крестик, Tab зациклен в
// панели, на закрытии возвращается на триггер. Контент скроллится сам
// (data-lenis-prevent). children — контент; footer — закреплённый низ (опц.).

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Подстраховка от утечки при SPA-навигации: cleanup React-эффекта может не
// сработать, т.к. <ClientRouter/> свопает DOM без React-unmount. Модуль-левел
// слушатель (добавляется один раз, переживает навигации — как listeners в
// menu.ts) гарантированно снимает scroll-lock и inert перед свопом.
if (typeof document !== "undefined") {
  document.addEventListener("astro:before-swap", () => {
    document.documentElement.classList.remove("drawer-open");
    document.getElementById("main")?.removeAttribute("inert");
  });
}

const CloseIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden="true">
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

type Props = {
  open: boolean;
  onClose: () => void;
  // aria-label диалога.
  label?: string;
  children: ReactNode;
  // Закреплённый низ панели (вне прокрутки) — напр. контактный e-mail.
  footer?: ReactNode;
};

export default function Drawer({ open, onClose, label, children, footer }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  // onClose через ref → слушатели вешаем один раз (на [open]), без переподписки.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const main = document.getElementById("main");
    triggerRef.current = document.activeElement as HTMLElement | null;
    root.classList.add("drawer-open");
    main?.setAttribute("inert", ""); // изоляция фона для AT/фокуса (как у меню)
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      // Осиротевший после SPA-свопа хендлер (панель уже не в DOM) — no-op.
      if (!panelRef.current?.isConnected) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      root.classList.remove("drawer-open");
      main?.removeAttribute("inert");
      triggerRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={label}>
      {/* затемнение фона */}
      <div data-drawer-backdrop className="absolute inset-0 bg-ink/50 animate-[fade-in_0.25s_ease]" onClick={() => onCloseRef.current()} />
      {/* панель: 50% / min 900px (десктоп), во всю ширину (мобайл) */}
      <div
        ref={panelRef}
        data-drawer-panel
        className="absolute right-0 top-0 flex h-full w-1/2 min-w-[900px] flex-col bg-white shadow-popover animate-[drawer-in_0.32s_cubic-bezier(0.16,1,0.3,1)] max-lg:w-full max-lg:min-w-0"
      >
        {/* верхняя плашка: только закрыть */}
        <div className="flex shrink-0 items-center justify-end border-b border-border bg-surface px-8 py-4 max-lg:px-4 max-lg:py-3">
          <button ref={closeRef} type="button" onClick={() => onCloseRef.current()} aria-label="Закрыть" className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-ink transition-colors hover:bg-ink/5">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* прокручиваемый контент */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto px-12 py-10 max-lg:px-4 max-lg:py-6">
          {children}
        </div>

        {/* закреплённый низ (напр. e-mail) */}
        {footer && (
          <div className="shrink-0 border-t border-border px-12 py-5 max-lg:px-4 max-lg:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
