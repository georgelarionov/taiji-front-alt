// Единый источник СОСТАВА соцсетей (id/alt/href) для Menu и Footer.
// Раньше список был продублирован в Menu.astro и Footer.astro; сводим его сюда.
// Сами ассеты остаются локальными в каждом компоненте (разные форматы/размеры:
// Menu — svg-кнопки 56×56, Footer — png-иконки своих размеров) и подбираются по id.
export interface Social {
  id: string;
  alt: string;
  href: string;
}

export const socials: Social[] = [
  { id: "messenger", alt: "Мессенджер", href: "#" },
  { id: "telegram", alt: "Telegram", href: "#" },
  { id: "whatsapp", alt: "WhatsApp", href: "#" },
  { id: "vk", alt: "ВКонтакте", href: "#" },
];
