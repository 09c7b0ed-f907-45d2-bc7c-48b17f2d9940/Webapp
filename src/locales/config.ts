import en from '@/locales/en/common.json';
import el from '@/locales/el/common.json';
import cs from '@/locales/cs/common.json';

export const SUPPORTED_LANGUAGES = ['en','el','cs'] as const;
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number];
export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const resources: Record<LanguageCode, typeof en> = {
  en,
  el,
  cs,
};

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  el: 'Ελληνικά',
  cs: 'Čeština',
};
