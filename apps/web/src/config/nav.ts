// Единый источник навигации сайта. Раньше структура была продублирована в
// Hero.astro, Menu.astro и Footer.astro с расхождениями (орфография, состав
// колонок); теперь все потребители импортируют отсюда.
//
// - navCols / bigLinks — состав полноэкранного меню и футера (десктоп: колонки
//   с подпунктами + крупные ссылки; мобиль каждый строит свою раскладку из тех
//   же массивов).
// - topNav — горизонтальное меню в шапке Hero (только десктоп).

export interface NavLink {
  label: string;
  href: string;
}

export interface NavCol {
  title: string;
  href: string;
  links: NavLink[];
}

export const navCols: NavCol[] = [
  {
    title: "Тайцзицюань",
    href: "#",
    links: [
      { label: "История", href: "#" },
      { label: "Теория", href: "#" },
      { label: "Практика", href: "#" },
      { label: "Персоналии", href: "#" },
    ],
  },
  {
    title: "Общество",
    href: "#",
    links: [
      { label: "Миссия и ценности", href: "#" },
      { label: "Команда", href: "#" },
      { label: "Партнёры", href: "#" },
      { label: "Документы", href: "#" },
    ],
  },
  {
    title: "Исследования",
    href: "#",
    links: [
      { label: "Источники", href: "#" },
      { label: "Публикации", href: "#" },
    ],
  },
];

export const bigLinks: NavLink[] = [
  { label: "Новости", href: "#" },
  { label: "Мероприятия", href: "#" },
  { label: "Медиа-архив", href: "#" },
  { label: "Контакты", href: "#" },
];

export const topNav: NavLink[] = [
  { label: "Тайцзицюань", href: "#" },
  { label: "Исследования", href: "#" },
  { label: "Об Обществе", href: "#" },
  { label: "Мероприятия", href: "#" },
  { label: "Новости", href: "#" },
];
