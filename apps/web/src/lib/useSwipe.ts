import { useEffect, useRef, type RefObject } from "react";

// Горизонтальный свайп пальцем для слайдеров (мобайл). Только тач — мышь/десктоп
// не трогаем (клики по карточкам, выделение текста, hover-превью остаются как есть;
// тач-устройство и так = "мобильная версия"). Различаем направление жеста: если он
// преимущественно вертикальный — отдаём странице (нативный скролл), если
// горизонтальный и больше порога — дёргаем onLeft/onRight. Слушатели passive
// (не блокируем скролл); за разделение осей со стороны браузера отвечает
// touch-action: pan-y, который ставится на сам элемент в компоненте.
//
// Семантика: onLeft = свайп справа→налево (палец влево) → "следующий";
//            onRight = свайп слева→направо → "предыдущий".

type SwipeHandlers = {
  onLeft?: () => void;
  onRight?: () => void;
};

export function useSwipe<T extends HTMLElement>(
  elementRef: RefObject<T | null>,
  { onLeft, onRight }: SwipeHandlers,
  threshold = 44,
) {
  // Свежие колбэки держим в ref → слушатели вешаем один раз, а не пере-подписываемся
  // на каждый рендер (next/prev в компонентах пересоздаются каждый рендер).
  const handlers = useRef({ onLeft, onRight });
  handlers.current = { onLeft, onRight };

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let decided = false; // ось жеста уже определена?
    let horizontal = false;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return; // мульти-тач (pinch/zoom) — не наш кейс
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
      decided = false;
      horizontal = false;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking || decided) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      // ждём небольшого смещения (10px), потом фиксируем ось по доминанте
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      decided = true;
      horizontal = Math.abs(dx) > Math.abs(dy);
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      if (!horizontal) return; // вертикальный жест — это был скролл, игнор
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < threshold) return; // слишком короткий — не свайп
      if (dx < 0) handlers.current.onLeft?.();
      else handlers.current.onRight?.();
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [elementRef, threshold]);
}
