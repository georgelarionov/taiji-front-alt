// Сквозные настройки и тексты страниц (глобалы Payload).

import { fetchGlobal, toImage, type CmsImage } from './client'

export interface Social {
  id: string
  alt: string
  href: string
}

export interface SiteSettings {
  phone: string
  phoneHref: string
  email: string
  address?: string
  workingHours?: string
  supportLine1: string
  supportLine2: string
  socials: Social[]
  mapEmbed?: string
}

export interface NavLink {
  label: string
  href: string
}

export interface NavCol {
  title: string
  href: string
  links: NavLink[]
}

export interface Navigation {
  navCols: NavCol[]
  bigLinks: NavLink[]
  topNav: NavLink[]
}

export interface HomeCard {
  title: string
  description: string
  href: string
  image?: CmsImage
}

export interface AboutContent {
  heading: string
  subtitle?: string
  cards: { title: string; desc: string; href: string; image?: CmsImage }[]
}

export interface ContactsContent {
  heading: string
  intro?: string
  ctaTitle: string
  ctaText?: string
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const g = await fetchGlobal<any>('site-settings')
  return {
    phone: g.phone,
    phoneHref: g.phoneHref,
    email: g.email,
    address: g.address || undefined,
    workingHours: g.workingHours || undefined,
    supportLine1: g.supportLine1 || '',
    supportLine2: g.supportLine2 || '',
    // В CMS поле называется network (id занято служебным ключом строки массива),
    // а компоненты подбирают иконку по id — переименовываем на входе.
    socials: (g.socials || []).map((s: any) => ({ id: s.network, alt: s.alt, href: s.href })),
    mapEmbed: g.mapEmbed || undefined,
  }
}

export async function getNavigation(): Promise<Navigation> {
  const g = await fetchGlobal<any>('navigation')
  return {
    navCols: (g.columns || []).map((c: any) => ({
      title: c.title,
      href: c.href,
      links: (c.links || []).map((l: any) => ({ label: l.label, href: l.href })),
    })),
    bigLinks: (g.bigLinks || []).map((l: any) => ({ label: l.label, href: l.href })),
    topNav: (g.topNav || []).map((l: any) => ({ label: l.label, href: l.href })),
  }
}

export async function getHomeCards(): Promise<HomeCard[]> {
  const g = await fetchGlobal<any>('home')
  return (g.cards || []).map((c: any) => ({
    title: c.title,
    description: c.description,
    href: c.href,
    image: toImage(c.image, c.imageAlt),
  }))
}

export async function getAboutContent(): Promise<AboutContent> {
  const g = await fetchGlobal<any>('about-block')
  return {
    heading: g.heading || 'О тайцзицюань',
    subtitle: g.subtitle || undefined,
    cards: (g.cards || []).map((c: any) => ({
      title: c.title,
      desc: c.desc,
      href: c.href,
      image: toImage(c.image, c.title),
    })),
  }
}

export async function getContactsContent(): Promise<ContactsContent> {
  const g = await fetchGlobal<any>('contacts-page')
  return {
    heading: g.heading || 'Контакты',
    intro: g.intro || undefined,
    ctaTitle: g.ctaTitle || 'Отправить сообщение',
    ctaText: g.ctaText || undefined,
  }
}
