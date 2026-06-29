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
      { label: "Документы", href: "/society#documents" },
      { label: "Партнёры", href: "/society#partners" },
    ],
  },
  {
    // /research — якорные блоки (scroll-mt-24 в самой странице): #sources
    // (Источники), #publications (Публикации), #conferences (Конференции) и
    // #festivals (Фестивали) — последние два пока заглушки.
    title: "Исследования",
    href: "/research",
    links: [
      { label: "Источники", href: "/research#sources" },
      { label: "Публикации", href: "/research#publications" },
      { label: "Конференции", href: "/research#conferences" },
      { label: "Фестивали", href: "/research#festivals" },
    ],
  },
];

export const bigLinks: NavLink[] = [
  { label: "Новости", href: "/news" },
  { label: "Анонсы", href: "/events" },
  { label: "Медиа-архив", href: "/media-archive" },
  { label: "Контакты", href: "/contacts" },
];

export const topNav: NavLink[] = [
  { label: "Общество", href: "/society" },
  { label: "Тайцзицюань", href: "/taijiquan" },
  { label: "Новости", href: "/news" },
  { label: "Исследования", href: "/research" },
  { label: "Анонсы", href: "/events" },
];
