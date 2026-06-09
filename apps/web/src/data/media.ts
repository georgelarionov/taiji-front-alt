// Единый источник медиа-архива (заглушки; CMS позже). Потребители: страница
// /media-archive (остров MediaArchive — табы Видео/Фото, фильтр, дровер).
// Реальные ролики/галереи/тексты придут из CMS; пока — статичный стаб.

export interface MediaVideo {
  id: string;
  category: string; // Урок / Мастер-класс / Интервью / Выступление
  date: string;
  title: string;
  desc: string;
}

export interface MediaPhoto {
  id: string;
  meta: string; // «24 фото · Июнь 2025»
  title: string;
  desc: string;
}

export interface VideoFilter {
  label: string;
  category: string | null; // null = «Все»
}

export const videos: MediaVideo[] = [
  { id: "tuishou-basics", category: "Мастер-класс", date: "15 марта 2026", title: "Основы туйшоу: принципы парной практики", desc: "Мастер Чэнь Юй демонстрирует базовые понятия парной работы в традиции Чэнь." },
  { id: "udan-interview", category: "Интервью", date: "2 февраля 2026", title: "Интервью с исследователем традиции Удан", desc: "Беседа о связи даосских практик и внутренних боевых искусств." },
  { id: "moscow-demo", category: "Выступление", date: "10 января 2026", title: "Демонстрация на конференции в Москве", desc: "Демонстрация различных направлений на ежегодной встрече Общества." },
  { id: "standing-post", category: "Урок", date: "28 ноября 2025", title: "Столбовое стояние: традиция и подходы", desc: "Обзор подходов к столбовой практике в разных школах." },
  { id: "yang-master-talk", category: "Интервью", date: "5 октября 2025", title: "Беседа с мастером стиля Ян", desc: "О традиции, преемственности и современном понимании внутренних искусств." },
  { id: "taolu-masterclass", category: "Мастер-класс", date: "18 сентября 2025", title: "Мастер-класс по таолу: форма и принципы", desc: "Практический семинар по изучению комплекса таолу в традиции Чэнь." },
];

export const photos: MediaPhoto[] = [
  { id: "festival-2025", meta: "24 фото · Июнь 2025", title: "Ежегодный фестиваль 2025", desc: "Фоторепортаж с ежегодного фестиваля тайцзицюань в Москве." },
  { id: "spb-seminar", meta: "18 фото · Март 2025", title: "Семинар в Петербурге", desc: "Фотографии с семинара по парной практике в Санкт-Петербурге." },
  { id: "historical-archive", meta: "42 фото · Архив", title: "Исторический архив", desc: "Исторические фотографии и гравюры мастеров прошлых поколений." },
];

export const videoFilters: VideoFilter[] = [
  { label: "Все", category: null },
  { label: "Уроки", category: "Урок" },
  { label: "Мастер-классы", category: "Мастер-класс" },
  { label: "Интервью", category: "Интервью" },
  { label: "Выступления", category: "Выступление" },
];
