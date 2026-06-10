// Единый источник SEO/AEO-данных и помощников для structured data (JSON-LD).
//
// Что здесь:
//   • SITE_NAME / SITE_DESCRIPTION — общие строки сайта (синхронны дефолтам BaseLayout);
//   • ORG — контактные данные Общества (из блока «Контакты» / футера);
//   • siteGraph() — site-wide узлы Organization + WebSite (рендерятся на каждой странице);
//   • orgId/websiteId — @id site-wide узлов для cross-script связывания (Google мёржит
//     все JSON-LD на странице в один граф, поэтому @id-ссылки работают между скриптами);
//   • ruDateToISO() — парсер русских дат «21 мая 2026 г.» → «2026-05-21» (для datePublished);
//   • билдеры узлов страниц: webPage/aboutPage/contactPage/collectionPage/article/personCollection.
//
// Контракт: BaseLayout собирает { @context, @graph: [...siteGraph, ...schema] } в один
// <script>. Страницы передают свой основной узел через prop `schema` (билдеры ниже).
// Breadcrumbs.astro эмитит свой BreadcrumbList отдельным скриптом.

export const SITE_NAME = "Общество изучения традиционного тайцзицюань";
export const SITE_DESCRIPTION =
  "Информационный портал Общества изучения традиционного тайцзицюань: исследования, сохранение и развитие традиции в России.";

const SCHEMA_CONTEXT = "https://schema.org";
const LANG = "ru-RU";

// Контактные данные Общества (см. components/Contacts.astro и Footer).
export const ORG = {
  email: "info@taiji-society.ru",
  phone: "+7 903 747 9367",
  address: {
    locality: "Москва",
    street: "Нахимовский проспект, д.32",
    country: "RU",
  },
  // Установленное веб-присутствие Общества (контент перенесён оттуда) — помогает
  // entity-распознаванию через sameAs. Соцсети пока заглушки (#) → в sameAs не идут.
  sameAs: ["https://taiji-society.ru"],
};

// Абсолютный URL на канон-домене (Astro.site). path — «/news/foo» или ImageMetadata.src;
// абсолютный URL во входе возвращается как есть (нужно для внешних ссылок в ItemList).
function abs(site: URL | undefined, path: string): string {
  return new URL(path, site).href;
}

// @id site-wide узлов (фрагмент на корне домена) — стабильны между всеми страницами.
export function orgId(site: URL | undefined): string {
  return `${new URL("/", site).href}#organization`;
}
export function websiteId(site: URL | undefined): string {
  return `${new URL("/", site).href}#website`;
}

// Site-wide граф: Organization (издатель) + WebSite. На каждой странице.
export function siteGraph(site: URL | undefined): object[] {
  const home = new URL("/", site).href;
  return [
    {
      "@type": "Organization",
      "@id": orgId(site),
      name: SITE_NAME,
      url: home,
      logo: new URL("/web-app-manifest-512x512.png", site).href,
      image: new URL("/og-default.png", site).href,
      email: ORG.email,
      telephone: ORG.phone,
      address: {
        "@type": "PostalAddress",
        addressLocality: ORG.address.locality,
        streetAddress: ORG.address.street,
        addressCountry: ORG.address.country,
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: ORG.email,
        telephone: ORG.phone,
        availableLanguage: ["Russian", "Chinese"],
      },
      sameAs: ORG.sameAs,
    },
    {
      "@type": "WebSite",
      "@id": websiteId(site),
      name: SITE_NAME,
      url: home,
      description: SITE_DESCRIPTION,
      inLanguage: LANG,
      publisher: { "@id": orgId(site) },
    },
  ];
}

// ── Парсер русских дат публикации ───────────────────────────────────────────
// Месяцы в родительном падеже → номер.
const RU_MONTHS: Record<string, string> = {
  января: "01",
  февраля: "02",
  марта: "03",
  апреля: "04",
  мая: "05",
  июня: "06",
  июля: "07",
  августа: "08",
  сентября: "09",
  октября: "10",
  ноября: "11",
  декабря: "12",
};

// «21 мая 2026 г.» → «2026-05-21». Невалидный вход → undefined (datePublished опускаем).
// `(?!\d)` после года отсекает «слипшиеся» опечатки («20267»→undefined, а не «2026»);
// диапазон дня 1–31 отсекает «00 мая»/«99 мая» (иначе ушла бы битая ISO-дата).
export function ruDateToISO(date: string): string | undefined {
  const m = date.trim().match(/^(\d{1,2})\s+([а-яё]+)\s+(\d{4})(?!\d)/i);
  if (!m) return undefined;
  const day = Number(m[1]);
  const month = RU_MONTHS[m[2].toLowerCase()];
  if (!month || day < 1 || day > 31) return undefined;
  return `${m[3]}-${month}-${String(day).padStart(2, "0")}`;
}

// ── Билдеры узлов страниц ────────────────────────────────────────────────────
export interface PageArgs {
  site: URL | undefined;
  path: string; // Astro.url.pathname
  name: string; // чистый заголовок страницы (без суффикса «— Общество…»)
  description: string;
  image?: string; // абсолютный URL или путь/ImageMetadata.src (резолвится к site)
}

// Базовый веб-узел (WebPage и подтипы AboutPage/ContactPage/CollectionPage).
function webNode(type: string, a: PageArgs, extra: object = {}): object {
  const url = abs(a.site, a.path);
  return {
    "@type": type,
    "@id": `${url}#page`,
    url,
    name: a.name,
    description: a.description,
    isPartOf: { "@id": websiteId(a.site) },
    inLanguage: LANG,
    ...(a.image ? { primaryImageOfPage: abs(a.site, a.image) } : {}),
    ...extra,
  };
}

export const webPageSchema = (a: PageArgs): object => webNode("WebPage", a);

export const aboutPageSchema = (a: PageArgs): object =>
  webNode("AboutPage", a, { about: { "@id": orgId(a.site) } });

export const contactPageSchema = (a: PageArgs): object =>
  webNode("ContactPage", a, { about: { "@id": orgId(a.site) } });

// Элемент списка для CollectionPage: name + href (внутренний или внешний URL).
// type — опц. тип ресурса: задан → элемент как `item: {@type, name, url}` (для
// внешних работ — CreativeWork/ScholarlyArticle); не задан → «голый» url+name
// (форма «список своих страниц», напр. лента новостей).
export interface ListEntry {
  href: string;
  name: string;
  type?: string;
}

// CollectionPage + (опц.) mainEntity ItemList ссылок (лента/раздел-список).
export function collectionPageSchema(a: PageArgs, items?: ListEntry[]): object {
  const extra = items?.length
    ? {
        mainEntity: {
          "@type": "ItemList",
          itemListElement: items.map((it, i) => ({
            "@type": "ListItem",
            position: i + 1,
            ...(it.type
              ? { item: { "@type": it.type, name: it.name, url: abs(a.site, it.href) } }
              : { url: abs(a.site, it.href), name: it.name }),
          })),
        },
      }
    : {};
  return webNode("CollectionPage", a, extra);
}

// CollectionPage с ItemList персон (мастера тайцзицюань).
export function personCollectionSchema(
  a: PageArgs,
  persons: { name: string; cjk?: string }[],
): object {
  return webNode("CollectionPage", a, {
    mainEntity: {
      "@type": "ItemList",
      itemListElement: persons.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Person",
          name: p.name,
          ...(p.cjk ? { alternateName: p.cjk } : {}),
        },
      })),
    },
  });
}

export interface ArticleOpts {
  type?: "Article" | "NewsArticle" | "ScholarlyArticle";
  datePublished?: string;
  dateModified?: string;
  section?: string;
}

// Article / NewsArticle (лонгриды /taijiquan/*, статьи /news/*). Издатель и автор —
// Общество (по @id site-wide узла). mainEntityOfPage — URL самой страницы.
export function articleSchema(a: PageArgs, opts: ArticleOpts = {}): object {
  const url = abs(a.site, a.path);
  return {
    "@type": opts.type ?? "Article",
    "@id": `${url}#article`,
    headline: a.name,
    description: a.description,
    mainEntityOfPage: url,
    url,
    inLanguage: LANG,
    ...(a.image ? { image: abs(a.site, a.image) } : {}),
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    ...(opts.dateModified ?? opts.datePublished
      ? { dateModified: opts.dateModified ?? opts.datePublished }
      : {}),
    ...(opts.section ? { articleSection: opts.section } : {}),
    author: { "@id": orgId(a.site) },
    publisher: { "@id": orgId(a.site) },
    isPartOf: { "@id": websiteId(a.site) },
  };
}

// Обёртка графа для рендера одним скриптом (используется BaseLayout).
export function graph(nodes: object[]): object {
  return { "@context": SCHEMA_CONTEXT, "@graph": nodes };
}
