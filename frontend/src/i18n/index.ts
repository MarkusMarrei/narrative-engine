import { create } from 'zustand';
import type { SupportedLanguage, LanguageMeta, TranslationSchema } from './types.ts';
import { ru } from './locales/ru.ts';
import { en } from './locales/en.ts';
import { de } from './locales/de.ts';
import { fr } from './locales/fr.ts';
import { es } from './locales/es.ts';
import { pt } from './locales/pt.ts';
import { it } from './locales/it.ts';
import { ja } from './locales/ja.ts';
import { ko } from './locales/ko.ts';

export * from './types.ts';

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
];

export const translations: Record<SupportedLanguage, TranslationSchema> = {
  ru,
  en,
  de,
  fr,
  es,
  pt,
  it,
  ja,
  ko,
};

const DEFAULT_NODE_TITLES: Record<string, string[]> = {
  dialogue: [
    'реплика',
    'диалог',
    'dialogue',
    'dialogzeile',
    'réplique',
    'diálogo',
    'fala',
    'battuta',
    'セリフ',
    '대사',
    'новый шаг',
    'new step',
  ],
  character: [
    'персонаж',
    'герой',
    'character',
    'charakter',
    'personnage',
    'personaje',
    'personagem',
    'personaggio',
    'キャラクター',
    '등장인물',
    'новый шаг',
    'new step',
  ],
  emotion: [
    'эмоция героя',
    'эмоция',
    'emotion',
    'hero emotion',
    'emotion des helden',
    'émotion du héros',
    'émotion',
    'emoción del personaje',
    'emoción',
    'emoção do personagem',
    'emoção',
    'emozione personaggio',
    'emozione',
    '表情・感情',
    '感情',
    '캐릭터 감정',
    '감정',
    'новый шаг',
    'new step',
  ],
  appearance: [
    'внешность героя',
    'внешность',
    'костюм',
    'appearance',
    'hero appearance',
    'aussehen des helden',
    'aussehen',
    'apparence du héros',
    'apparence',
    'apariencia del personaje',
    'apariencia',
    'aparência do personagem',
    'aparência',
    'aspetto personaggio',
    'aspetto',
    '衣装・外見',
    '衣装',
    '캐릭터 의상',
    '의상',
    'новый шаг',
    'new step',
  ],
  background: [
    'фон',
    'фон сцены',
    'background',
    'hintergrund',
    'arrière-plan',
    'fond',
    'fondo',
    'sfondo',
    '背景（画像）',
    '背景',
    '배경',
    'новый шаг',
    'new step',
  ],
  music: [
    'музыка',
    'трек',
    'аудио',
    'music',
    'musik',
    'musique',
    'música',
    'musica',
    'bgm（音楽）',
    'bgm',
    '배경음악',
    '음악',
    'новый шаг',
    'new step',
  ],
  video: [
    'видео',
    'катсцена',
    'video',
    'vidéo',
    'vídeo',
    '動画',
    '비디오',
    'новый шаг',
    'new step',
  ],
  effect: [
    'эффект / режиссура',
    'эффект',
    'режиссура',
    'effect',
    'effect / staging',
    'effekt / regie',
    'effekt',
    'effet / régie',
    'effet / mise en scène',
    'effet',
    'efecto / dirección',
    'efecto',
    'efeito / direção',
    'efeito',
    'effetto / regia',
    'effetto',
    '演出・効果',
    '効果',
    '효과 / 연출',
    '효과',
    'новый шаг',
    'new step',
  ],
  choice: [
    'развилка',
    'развилка / выбор',
    'выбор',
    'choice',
    'choice / branching',
    'auswahl / verzweigung',
    'auswahl',
    'choix',
    'choix / embranchement',
    'bifurcación / opciones',
    'bifurcación',
    'escolha',
    'bivio',
    '選択肢（分岐）',
    '選択肢',
    '선택지',
    'новый шаг',
    'new step',
  ],
  variable: [
    'переменная',
    'флаг',
    'переменные',
    'variable',
    'var',
    'variabile',
    '変数フラグ',
    '変数',
    '변수 플래그',
    '변수',
    'новый шаг',
    'new step',
  ],
};

export function getLocalizedNodeTitle(
  targetNode: { node_type?: string; title?: string } | undefined | null,
  t: TranslationSchema
): string {
  if (!targetNode) return '';
  const nodeType = targetNode.node_type || '';
  const title = (targetNode.title || '').trim();

  const defaults = DEFAULT_NODE_TITLES[nodeType] || [];
  const lowerTitle = title.toLowerCase();

  const isDefault =
    !title ||
    title === 'Новый шаг' ||
    lowerTitle === nodeType.toLowerCase() ||
    defaults.includes(lowerTitle) ||
    Object.values(DEFAULT_NODE_TITLES).some((list) => list.includes(lowerTitle));

  if (isDefault) {
    const paletteItem = (t.palette?.nodes as any)?.[nodeType];
    if (paletteItem?.name) {
      return paletteItem.name;
    }
  }

  return title;
}

export function detectBrowserLanguage(): SupportedLanguage {
  const saved = localStorage.getItem('narrative_engine_lang') as SupportedLanguage | null;
  if (saved && translations[saved]) {
    return saved;
  }

  const browserLang = (
    navigator.language ||
    (navigator.languages && navigator.languages[0]) ||
    ''
  ).toLowerCase();

  if (browserLang.startsWith('ru') || browserLang.startsWith('be') || browserLang.startsWith('uk')) {
    return 'ru';
  }
  if (browserLang.startsWith('de')) return 'de';
  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('pt')) return 'pt';
  if (browserLang.startsWith('it')) return 'it';
  if (browserLang.startsWith('ja')) return 'ja';
  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang.startsWith('en')) return 'en';

  return 'en';
}

interface I18nState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationSchema;
}

export const useI18nStore = create<I18nState>((set) => {
  const initialLang = detectBrowserLanguage();
  return {
    language: initialLang,
    t: translations[initialLang],
    setLanguage: (lang: SupportedLanguage) => {
      localStorage.setItem('narrative_engine_lang', lang);
      document.documentElement.lang = lang;
      set({
        language: lang,
        t: translations[lang],
      });
    },
  };
});

export function useTranslation() {
  const language = useI18nStore((s) => s.language);
  const setLanguage = useI18nStore((s) => s.setLanguage);
  const t = useI18nStore((s) => s.t);
  return { language, setLanguage, t };
}
