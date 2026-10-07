import {
  BoldFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  StrikethroughFeature,
  lexicalEditor,
  type FeatureProviderServer,
} from '@payloadcms/richtext-lexical'

// Визуальный редактор для текстов внутри блоков новости (абзац, пункт списка,
// цитата): только строчное оформление — жирный, курсив, зачёркнутый, ссылка.
// Абзацы, подзаголовки, списки и цитаты — это сами блоки конструктора, поэтому
// в редактор их не пускаем. Панель кнопок видна всегда (FixedToolbar) и всплывает
// над выделением (InlineToolbar). Сайт рендерит результат в lib/cms/rich-text.ts —
// новый вид оформления нужно добавить и туда.
//
// Ссылки — только на адрес (внутренние ссылки на документы выключены: сайту
// пришлось бы угадывать их URL).
export const INLINE_FEATURES: FeatureProviderServer<any, any, any>[] = [
  BoldFeature(),
  ItalicFeature(),
  StrikethroughFeature(),
  LinkFeature({ enabledCollections: [] }),
  FixedToolbarFeature(),
  InlineToolbarFeature(),
]

export const inlineEditor = lexicalEditor({
  features: () => INLINE_FEATURES,
  admin: {
    // «+», ручка перетаскивания и серая полоса слева нужны для блочных элементов,
    // которых здесь нет, — только путают.
    hideGutter: true,
    hideAddBlockButton: true,
    hideDraggableBlockElement: true,
    hideInsertParagraphAtEnd: true,
  },
})

export const INLINE_EDITOR_HINT =
  'Выделите слово — появятся кнопки: жирный, курсив, зачёркнутый, ссылка.'
