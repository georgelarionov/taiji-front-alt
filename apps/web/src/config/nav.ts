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
    href: "/taijiquan",
    links: [
      { label: "История", href: "/taijiquan/history" },
      { label: "Теория", href: "/taijiquan/theory" },
      { label: "Практика", href: "/taijiquan/practice" },
      { label: "Персоналии", href: "/taijiquan/person" },
    ],
  },
  {
    // Подпункты — секции одной страницы /society (якоря scroll-mt-24 в
    // components/society/*: #mission/#team/#partners/#documents).
    title: "Общество",
    href: "/society",
    links: [
      { label: "Миссия и ценности", href: "/society#mission" },
      { label: "Команда", href: "/society#team" },
      { label: "Партнёры", href: "/society#partners" },
      { label: "Документы", href: "/society#documents" },
    ],
  },
  {
    // /research — заглушка («Раздел в разработке»), отдельных секций нет,
    // поэтому оба подпункта ведут на саму страницу раздела.
    title: "Исследования",
    href: "/research",
    links: [
      { label: "Источники", href: "/research" },
      { label: "Публикации", href: "/research" },
    ],
  },
];

export const bigLinks: NavLink[] = [
  { label: "Новости", href: "/news" },
  { label: "Мероприятия", href: "/events" },
  { label: "Медиа-архив", href: "/media-archive" },
  { label: "Контакты", href: "/contacts" },
];

export const topNav: NavLink[] = [
  { label: "Тайцзицюань", href: "/taijiquan" },
  { label: "Исследования", href: "/research" },
  { label: "Об Обществе", href: "/society" },
  { label: "Мероприятия", href: "/events" },
  { label: "Новости", href: "/news" },
];
