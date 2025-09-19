import en from '@/locales/en/common.json';
import da from '@/locales/da/common.json';
import es from '@/locales/es/common.json';
import el from '@/locales/el/common.json';
import cs from '@/locales/cs/common.json';
import sv from '@/locales/sv/common.json';

export const SUPPORTED_LANGUAGES = ['en','da','es','el','cs','sv'] as const;
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number];
export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const resources: Record<LanguageCode, typeof en> = {
  en,
  da,
  es,
  el,
  cs,
  sv,
};

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  da: 'Dansk',
  es: 'Español',
  el: 'Ελληνικά',
  cs: 'Čeština',
  sv: 'Svenska',
};
