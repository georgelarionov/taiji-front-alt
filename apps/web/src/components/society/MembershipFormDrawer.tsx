import { useEffect, useState } from "react";
import Drawer from "../Drawer";

// Дровер с формой заявки на вступление в Общество (блок «Команда» на /society).
// Открывается по клику на триггер [data-membership-open] (кнопка «Отправить
// заявку» в CTA-карточке «Вступить в общество»). Использует общий Drawer.
// Форма моковая: по сабмиту (при согласии) — экран «Заявка отправлена». Стиль
// повторяет ContactFormDrawer (/contacts). Поля: ФИО, дата рождения, школа, стиль,
// линия преемственности, длительность занятий, контакты школы (сайт/почта/
// телефон/соцсети), видение вклада в работу Общества. E-mail Общества закреплён
// внизу панели (footer-слот Drawer).

type Props = {
  email: string;
};

// Делегированный click-листенер — ОДИН раз на модуль-левел (как в
// ContactFormDrawer / menu.ts): document переживает SPA-свопы, а cleanup
// React-эффекта при свопе может не сработать → листенер бы накапливался.
let pendingOpen: (() => void) | null = null;
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const trigger = (e.target as HTMLElement).closest?.("[data-membership-open]");
    if (!trigger) return;
    e.preventDefault();
    pendingOpen?.();
  });
}

export default function MembershipFormDrawer({ email }: Props) {
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
  const req = (
    <span className="text-accent" aria-hidden="true">
      *
    </span>
  );

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      label="Заявка на вступление в Общество"
      footer={
        <a
          href={`mailto:${email}`}
          className="font-sans text-sm text-ink/55 transition-colors hover:text-accent"
        >
          {email}
        </a>
      }
    >
      {sent ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
          <h2 className="font-serif text-[34px] font-semibold text-ink max-lg:text-[28px]">
            Заявка отправлена
          </h2>
          <p className="mt-3 font-sans text-base text-ink/65">
            Спасибо! Мы рассмотрим вашу заявку и свяжемся с вами.
          </p>
        </div>
      ) : (
        <>
          <h2 className="font-serif text-[32px] font-semibold leading-[1.2] text-ink max-lg:text-[24px]">
            Заявка на вступление в Общество
          </h2>
          <p className="mt-3 font-sans text-base text-ink/65">
            Заполните форму — она станет вашим заявлением на вступление.
          </p>

          <form
            className="mt-8 flex flex-col gap-6 max-lg:mt-6 max-lg:gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (agree) setSent(true);
            }}
          >
            <div>
              <label htmlFor="ms-fio" className={labelCls}>
                ФИО {req}
              </label>
              <input
                id="ms-fio"
                name="fio"
                required
                className={fieldCls}
                placeholder="Фамилия Имя Отчество"
              />
            </div>

            <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
              <div>
                <label htmlFor="ms-birth" className={labelCls}>
                  Дата рождения {req}
                </label>
                <input
                  id="ms-birth"
                  name="birth"
                  type="date"
                  required
                  className={fieldCls}
                />
              </div>
              <div>
                <label htmlFor="ms-duration" className={labelCls}>
                  Длительность занятий
                </label>
                <input
                  id="ms-duration"
                  name="duration"
                  className={fieldCls}
                  placeholder="Например, 8 лет"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
              <div>
                <label htmlFor="ms-school" className={labelCls}>
                  Название школы
                </label>
                <input
                  id="ms-school"
                  name="school"
                  className={fieldCls}
                  placeholder="Название школы"
                />
              </div>
              <div>
                <label htmlFor="ms-style" className={labelCls}>
                  Практикуемый стиль
                </label>
                <input
                  id="ms-style"
                  name="style"
                  className={fieldCls}
                  placeholder="Например, стиль Ян"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ms-lineage" className={labelCls}>
                Линия преемственности
              </label>
              <input
                id="ms-lineage"
                name="lineage"
                className={fieldCls}
                placeholder="Учителя и линия передачи"
              />
            </div>

            {/* Контакты школы */}
            <fieldset className="flex flex-col gap-5 border-0 p-0">
              <legend className="mb-1 font-display text-sm font-semibold text-ink">
                Контакты школы
              </legend>
              <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
                <div>
                  <label htmlFor="ms-site" className={labelCls}>
                    Сайт
                  </label>
                  <input
                    id="ms-site"
                    name="site"
                    type="url"
                    className={fieldCls}
                    placeholder="https://…"
                  />
                </div>
                <div>
                  <label htmlFor="ms-email" className={labelCls}>
                    Почта {req}
                  </label>
                  <input
                    id="ms-email"
                    name="email"
                    type="email"
                    required
                    title="Введите корректный e-mail"
                    className={fieldCls}
                    placeholder="email@domain.com"
                  />
                </div>
                <div>
                  <label htmlFor="ms-phone" className={labelCls}>
                    Телефон
                  </label>
                  <input
                    id="ms-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    pattern="[\d\s()+-]{7,}"
                    title="Введите корректный номер телефона (минимум 7 цифр)"
                    className={fieldCls}
                    placeholder="+7 999 999 99 99"
                  />
                </div>
                <div>
                  <label htmlFor="ms-social" className={labelCls}>
                    Соцсети
                  </label>
                  <input
                    id="ms-social"
                    name="social"
                    className={fieldCls}
                    placeholder="Ссылки на соцсети"
                  />
                </div>
              </div>
            </fieldset>

            <div>
              <label htmlFor="ms-contribution" className={labelCls}>
                Видение своего вклада в работу Общества
              </label>
              <textarea
                id="ms-contribution"
                name="contribution"
                className={`${fieldCls} min-h-[130px] resize-none max-lg:min-h-[110px]`}
                placeholder="Расскажите, чем хотели бы быть полезны Обществу"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                required
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
              />
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
              Отправить заявку
            </button>
          </form>
        </>
      )}
    </Drawer>
  );
}
