// ВНИМАНИЕ: сайт больше НЕ читает этот файл — новости приходят из CMS
// (см. apps/web/src/lib/cms/news.ts). Модули в src/data оставлены как исходник для
// первичного наполнения базы: apps/cms/scripts/migrate-from-code.ts собирает их и
// заливает в Payload. Правки контента делаются в админке, а не здесь.
//
// Контент перенесён с действующего сайта Общества (taiji-society.ru, раздел
// «Новости»). Каждая статья — отдельный модуль в ./news/<slug>.ts (метаданные +
// главное фото + тело из типизированных блоков). Здесь — только общие типы и
// сборка индекса (порядок — от свежих к старым). Эта же форма позже заполнится из
// CMS: фронтенд её не заметит.
//
// Поля статьи:
//   slug        — сегмент маршрута /news/<slug> (латиница, kebab-case);
//   date        — дата публикации (как показывается, напр. «18 апреля 2026 г.»);
//   title       — полный заголовок (h1 статьи, заголовок карточки);
//   shortTitle  — короткий вариант для хлебных крошек;
//   excerpt     — лид/анонс (карточка ленты, og:description) — свой у каждой статьи;
//   readingTime — оценка времени чтения (по объёму текста);
//   image       — главное фото (карточка ленты + шапка статьи), импорт-ассет;
//   imageAlt    — alt главного фото;
//   body        — тело статьи: массив блоков (см. Block);
//   author      — источник; по умолчанию — Общество (SOCIETY_AUTHOR).

import type { ImageMetadata } from "astro";

export interface NewsAuthor {
  name: string;
  role?: string;
}

// Блоки тела статьи (rich-text). Рендерятся в ArticleBody на тип-шкале проекта.
export type Block =
  | { type: "p"; text: string; lead?: boolean } // абзац (lead — первый, акцентный)
  | { type: "h2"; text: string } // подзаголовок внутри статьи
  | { type: "list"; items: string[] } // маркированный список
  | { type: "image"; src: ImageMetadata; alt: string; caption?: string } // врезанное фото
  | { type: "quote"; text: string } // цитата
  | { type: "video"; embed: string; title?: string }; // встроенное видео (src iframe)

export interface NewsArticle {
  slug: string;
  date: string;
  title: string;
  shortTitle: string;
  excerpt: string;
  readingTime: string;
  image?: ImageMetadata; // главное фото; нет — фолбэк-плейсхолдер в карточке/шапке
  imageAlt?: string;
  body: Block[];
  author?: NewsAuthor;
}

// На сайте у статей нет персональных авторов — источником указывается Общество.
export const SOCIETY_AUTHOR: NewsAuthor = {
  name: "Общество изучения традиционного тайцзицюань",
};

// Каждая статья — свой модуль. Порядок в массиве = порядок в ленте (свежие сверху).
import tolyattiStrategicSession from "./news/tolyatti-strategic-session";
import legendsOfTaijiFestival from "./news/legends-of-taiji-festival";
import pmef2026 from "./news/pmef-2026";
import chairmanVisitsBeijing from "./news/chairman-visits-beijing";
import presidentialCommendation from "./news/presidential-commendation";
import iksaRanOpenDay from "./news/iksa-ran-open-day";
import wushuFederationAward from "./news/wushu-federation-award";
import tvBricsInterview from "./news/tv-brics-interview";
import samaraActivityConference from "./news/samara-activity-conference";
import minskTaijiquanDay from "./news/minsk-taijiquan-day";
import taijiquanDayMarch21 from "./news/taijiquan-day-march-21";
import taijiquanGoesGlobal from "./news/taijiquan-goes-global";
import taijiquanDayMoscow from "./news/taijiquan-day-moscow";
import taijiquanDayUnescoHq from "./news/taijiquan-day-unesco-hq";
import conferenceVideo from "./news/conference-video";
import greetingDeputyForeignMinister from "./news/greeting-deputy-foreign-minister";
import greetingChineseAmbassador from "./news/greeting-chinese-ambassador";
import greetingSocietyChairman from "./news/greeting-society-chairman";
import firstTaijiquanConference from "./news/first-taijiquan-conference";
import conferenceProgram from "./news/conference-program";
import meetingOrthodoxChurch from "./news/meeting-orthodox-church";
import samaraSportsForum from "./news/samara-sports-forum";
import unescoDeclaresTaijiquanDay from "./news/unesco-declares-taijiquan-day";

export const articles: NewsArticle[] = [
  tolyattiStrategicSession,
  legendsOfTaijiFestival,
  pmef2026,
  chairmanVisitsBeijing,
  presidentialCommendation,
  iksaRanOpenDay,
  wushuFederationAward,
  tvBricsInterview,
  samaraActivityConference,
  minskTaijiquanDay,
  taijiquanDayMarch21,
  taijiquanGoesGlobal,
  taijiquanDayMoscow,
  taijiquanDayUnescoHq,
  conferenceVideo,
  greetingDeputyForeignMinister,
  greetingChineseAmbassador,
  greetingSocietyChairman,
  firstTaijiquanConference,
  conferenceProgram,
  meetingOrthodoxChurch,
  samaraSportsForum,
  unescoDeclaresTaijiquanDay,
];

// «Другие новости» для статьи: все, кроме текущей, в исходном порядке, первые n.
export function relatedArticles(slug: string, n = 6): NewsArticle[] {
  return articles.filter((a) => a.slug !== slug).slice(0, n);
}

// Материалы первой конференции (Москва, декабрь 2025) — для хаба-дровера на /research.
// Ссылаемся на уже существующие статьи ленты (без отдельной страницы). Порядок = как в
// articles (свежие сверху: видеозапись → приветствия → о конференции → программа).
export const CONFERENCE_2025_SLUGS = [
  "conference-video",
  "greeting-deputy-foreign-minister",
  "greeting-chinese-ambassador",
  "greeting-society-chairman",
  "first-taijiquan-conference",
  "conference-program",
];

export const conferenceArticles: NewsArticle[] = articles.filter((a) =>
  CONFERENCE_2025_SLUGS.includes(a.slug),
);
