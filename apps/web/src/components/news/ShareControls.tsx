import { useEffect, useRef, useState } from "react";

// Контролы «Поделиться» страницы статьи (по референсу: отдельная кнопка
// «скопировать ссылку» + «…», открывающая поповер соцсетей). Остров client:load —
// нужен runtime (clipboard, window.open, открытие/закрытие поповера).
//
// Цели шеринга: ВКонтакте и Telegram — реальные share-диалоги (window.open);
// WeChat в вебе не имеет share-URL → копируем ссылку (полноценный QR-поповер —
// задел на будущее). URL берём из window.location.href в момент клика, поэтому
// шеринг не зависит от плейсхолдера домена в astro.config.
//
// Токены проекта: круглые кнопки border-border / hover bg-surface, поповер на
// белом с shadow-popover. Доступность: aria-haspopup/expanded, role="menu",
// закрытие по Esc и клику вне.

type Props = {
  // Заголовок статьи — текст для share-диалогов ВК/Telegram.
  title: string;
};

const TOAST_MS = 1800;

/* ---- иконки (inline SVG, currentColor — единый стиль с lib/icons) ---------- */
const LinkIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const CheckIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const DotsIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" />
  </svg>
);
// VK / Telegram — те же фирменные глифы, что в бургер-меню (src/assets/menu/
// social-vk.svg / social-telegram.svg): берём их path как currentColor (без
// рамки-rect), viewBox обрезан по глифу, чтобы он заполнял слот.
const VkIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="13 18.5 30 19" fill="currentColor" className={className} aria-hidden="true">
    <path d="M26.0453 36.03C26.9127 36.2664 30.4565 37.1954 30.4565 35.5139V32.1047C31.2443 29.926 34.1674 33.4819 36.8889 36.5H41.1992C41.7775 36.5 42.1674 35.8888 41.9286 35.3509C40.7589 32.7104 38.4061 30.5508 36.9074 29.1871C36.5865 28.8937 36.5493 28.3912 36.8252 28.0543C38.4671 26.0414 40.0029 23.5286 41.5361 20.717C41.8332 20.1737 41.4485 19.5027 40.8385 19.5027H36.6501C34.8491 22.7843 32.7695 26.237 31.4512 27.4132C31.0639 27.7609 30.4565 27.4811 30.4565 26.9541V20.1167C30.4565 19.7771 30.1886 19.5054 29.857 19.5054H24.7164C24.1912 19.5054 23.9154 20.1492 24.2761 20.5377L24.3583 20.6301C25.04 21.3988 25.4008 22.4094 25.4008 23.4498V28.2309C25.4008 28.6764 24.9498 28.9752 24.552 28.7878C22.1117 27.6387 20.3928 23.5368 19.1276 19.7771C19.0719 19.6114 18.9207 19.5 18.7509 19.5H14.5997C14.2469 19.5 13.9684 19.8124 14.0029 20.171C14.1488 21.7438 14.544 23.2814 15.1116 24.7538C17.0002 29.6435 20.8968 34.6229 26.0427 36.0273L26.0453 36.03Z" />
  </svg>
);
const TelegramIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="17 19.5 22 17" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.3749 26.9574C24.7435 24.8416 28.324 23.4449 30.1142 22.7709C35.23 20.8461 36.2934 20.5109 36.9864 20.5001C37.1397 20.4983 37.4782 20.5325 37.6993 20.6947C37.8825 20.8317 37.9343 21.0155 37.9621 21.1453C37.986 21.275 38.0159 21.5706 37.99 21.8013C37.7132 24.4361 36.5144 30.8322 35.9031 33.7842C35.6462 35.0331 35.1384 35.4512 34.6465 35.4927C33.5752 35.581 32.7647 34.8529 31.7292 34.2383C30.1102 33.276 29.1942 32.6776 27.6211 31.7405C25.8029 30.6555 26.9818 30.0608 28.0173 29.0858C28.2882 28.8317 33.0017 24.9515 33.0913 24.6001C33.1032 24.5568 33.1152 24.3928 33.0057 24.3063C32.9001 24.2198 32.7408 24.2487 32.6253 24.2721C32.462 24.3063 29.8753 25.8544 24.8551 28.9182C24.1222 29.3742 23.4571 29.5976 22.8577 29.5868C22.2026 29.5742 20.9361 29.2498 19.9942 28.9741C18.8432 28.6335 17.9252 28.455 18.0048 27.8783C18.0446 27.5792 18.5027 27.271 19.3749 26.9574Z" />
  </svg>
);
// WeChat в меню нет — рисуем в том же solid-стиле (две залитые «реплики» с
// глазами-проколами; фон поповера белый, поэтому глаза белые).
const WeChatIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="currentColor" d="M9.4 3.2C5.3 3.2 2 6 2 9.5c0 2 1.1 3.8 2.8 5L4 17.2l2.9-1.5c.8.2 1.6.4 2.5.4.2 0 .5 0 .7-.03C9.7 15.3 9.5 14.4 9.5 13.5c0-3.1 3-5.6 6.8-5.6.3 0 .6 0 .9.05C16.5 5 13.3 3.2 9.4 3.2Z" />
    <path fill="currentColor" d="M22 13.4c0-2.7-2.7-4.9-6-4.9s-6 2.2-6 4.9 2.7 4.9 6 4.9c.7 0 1.4-.1 2-.3l2.2 1.2-.6-1.9c1.5-.9 2.4-2.3 2.4-3.9Z" />
    <circle cx="6.6" cy="8.4" r="0.95" fill="#fff" />
    <circle cx="11.4" cy="8.4" r="0.95" fill="#fff" />
    <circle cx="14.4" cy="12.6" r="0.8" fill="#fff" />
    <circle cx="18.2" cy="12.6" r="0.8" fill="#fff" />
  </svg>
);

export default function ShareControls({ title }: Props) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Галочка «скопировано» — ТОЛЬКО для самой кнопки копирования (не для WeChat /
  // не для ошибки), поэтому отдельно от общего toast.
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // Закрытие поповера по Esc и клику вне корня.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const flash = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      setCopied(false);
    }, TOAST_MS);
  };

  const currentUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  // Копирование ссылки: Clipboard API + textarea-фолбэк для незащищённого контекста.
  // markButton=true → показать галочку на кнопке копирования (для самой кнопки, не WeChat).
  const copyLink = async (msg: string, markButton = false) => {
    const url = currentUrl();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      if (markButton) setCopied(true);
      flash(msg);
    } catch {
      flash("Не удалось скопировать");
    }
  };

  const openShare = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const menu = [
    {
      label: "ВКонтакте",
      icon: <VkIcon className="h-[22px] w-[22px]" />,
      onClick: () =>
        openShare(
          `https://vk.com/share.php?url=${encodeURIComponent(currentUrl())}&title=${encodeURIComponent(title)}`,
        ),
    },
    {
      // WeChat: веб-шеринга нет → копируем ссылку (QR — задел на будущее).
      label: "WeChat",
      icon: <WeChatIcon className="h-[22px] w-[22px]" />,
      onClick: () => {
        copyLink("Ссылка скопирована — откройте в WeChat");
        setOpen(false);
      },
    },
    {
      label: "Telegram",
      icon: <TelegramIcon className="h-[22px] w-[22px]" />,
      onClick: () =>
        openShare(
          `https://t.me/share/url?url=${encodeURIComponent(currentUrl())}&text=${encodeURIComponent(title)}`,
        ),
    },
  ];

  return (
    <div ref={rootRef} className="relative flex items-center gap-3">
      {/* тост (общий для копирования / WeChat) */}
      {toast && (
        <span
          role="status"
          className="absolute -top-10 right-0 z-[60] whitespace-nowrap rounded bg-ink px-2.5 py-1 font-display text-xs font-semibold text-white animate-[fade-in_0.18s_ease_both] motion-reduce:animate-none"
        >
          {toast}
        </span>
      )}

      {/* копировать ссылку — отдельная кнопка */}
      <button
        type="button"
        onClick={() => copyLink("Ссылка скопирована", true)}
        aria-label="Скопировать ссылку"
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border text-ink transition-colors hover:bg-surface"
      >
        {copied ? <CheckIcon className="h-[18px] w-[18px] text-accent" /> : <LinkIcon className="h-[18px] w-[18px]" />}
      </button>

      {/* «…» — меню соцсетей */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Поделиться"
          aria-haspopup="menu"
          aria-expanded={open}
          className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border transition-colors ${
            open ? "border-accent bg-accent-soft text-accent" : "border-border text-ink hover:bg-surface"
          }`}
        >
          <DotsIcon className="h-[18px] w-[18px]" />
        </button>

        {open && (
          <div
            role="menu"
            aria-label="Поделиться в соцсетях"
            className="absolute right-0 top-[52px] z-50 w-[240px] overflow-hidden rounded-xl border border-border bg-white p-2 shadow-popover animate-[fade-in_0.18s_ease_both] motion-reduce:animate-none"
          >
            {menu.map((it) => (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                onClick={it.onClick}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-ink transition-colors hover:bg-surface"
              >
                <span className="grid h-6 w-6 place-items-center text-ink/80">{it.icon}</span>
                <span className="font-sans text-base font-medium">{it.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
