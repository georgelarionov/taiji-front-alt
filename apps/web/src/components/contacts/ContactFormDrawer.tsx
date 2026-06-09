import { useEffect, useState } from "react";
import Drawer from "../Drawer";

// Дровер с формой обратной связи (/contacts). Открывается по клику на любой
// триггер [data-contact-open] в статической разметке страницы (карточка
// «Отправить сообщение» в Astro). Использует общий Drawer. Форма моковая: по
// сабмиту (при согласии) — экран «Спасибо». E-mail закреплён внизу панели
// (footer-слот Drawer) — как в референсе.

type Props = {
  email: string;
};

// Делегированный click-листенер вешаем ОДИН раз на модуль-левел (как listeners
// в menu.ts): document переживает SPA-свопы, а cleanup React-эффекта при свопе
// может не сработать → листенер бы накапливался. Активный инстанс регистрирует
// свой opener в pendingOpen; следующий mount перезапишет его.
let pendingOpen: (() => void) | null = null;
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const trigger = (e.target as HTMLElement).closest?.("[data-contact-open]");
    if (!trigger) return;
    e.preventDefault();
    pendingOpen?.();
  });
}

export default function ContactFormDrawer({ email }: Props) {
  const [open, setOpen] = useState(false);
  const [agree, setAgree] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    pendingOpen = () => {
      setAgree(false);
      setSent(false);
      setOpen(true);
    };
    return () => {
      pendingOpen = null;
    };
  }, []);

  const fieldCls =
    "w-full bg-surface-sunken px-4 py-3.5 font-sans text-[15px] text-ink outline-none placeholder:text-ink/40 focus-visible:ring-2 focus-visible:ring-accent/40 max-lg:py-3";
  const labelCls = "mb-2 block font-display text-sm font-semibold text-ink";

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      label="Форма обратной связи"
      footer={
        <a href={`mailto:${email}`} className="font-sans text-sm text-ink/55 transition-colors hover:text-accent">
          {email}
        </a>
      }
    >
      {sent ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
          <h2 className="font-serif text-[34px] font-semibold text-ink max-lg:text-[28px]">Спасибо!</h2>
          <p className="mt-3 font-sans text-base text-ink/65">Мы свяжемся с вами в ближайшее время.</p>
        </div>
      ) : (
        <>
          <h2 className="font-serif text-[32px] font-semibold leading-[1.2] text-ink max-lg:text-[24px]">
            Заполните форму ниже, и мы свяжемся с вами в ближайшее время
          </h2>

          <form
            className="mt-8 flex flex-col gap-6 max-lg:mt-6 max-lg:gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (agree) setSent(true);
            }}
          >
            <div>
              <label htmlFor="cf-name" className={labelCls}>Как к вам обращаться</label>
              <input id="cf-name" name="name" className={fieldCls} placeholder="Ваше имя и / или фамилия" />
            </div>

            <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
              <div>
                <label htmlFor="cf-phone" className={labelCls}>
                  Номер телефона <span className="text-accent" aria-hidden="true">*</span>
                </label>
                <input
                  id="cf-phone"
                  name="phone"
                  type="tel"
                  required
                  inputMode="tel"
                  pattern="[\d\s()+-]{7,}"
                  title="Введите корректный номер телефона (минимум 7 цифр)"
                  className={fieldCls}
                  placeholder="+7 999 999 99 99"
                />
              </div>
              <div>
                <label htmlFor="cf-email" className={labelCls}>
                  E-mail <span className="text-accent" aria-hidden="true">*</span>
                </label>
                <input
                  id="cf-email"
                  name="email"
                  type="email"
                  required
                  title="Введите корректный e-mail"
                  className={fieldCls}
                  placeholder="email@domain.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cf-message" className={labelCls}>Сообщение</label>
              <textarea id="cf-message" name="message" className={`${fieldCls} min-h-[150px] resize-none max-lg:min-h-[130px]`} placeholder="Напишите сообщение" />
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-accent" />
              <span className="font-sans text-sm text-ink/65 max-lg:text-[13px]">
                Даю своё согласие на обработку персональных данных
              </span>
            </label>

            <button
              type="submit"
              disabled={!agree}
              className={`mt-2 w-full px-6 py-4 font-display text-base font-semibold text-white transition-colors ${
                agree ? "cursor-pointer bg-accent hover:bg-accent/90" : "cursor-not-allowed bg-ink/25"
              }`}
            >
              Отправить
            </button>
          </form>
        </>
      )}
    </Drawer>
  );
}
