import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, DEFAULT_LANGUAGE } from '@/locales/config';

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: Object.fromEntries(
        Object.entries(resources).map(([lng, json]: any) => [lng, { common: json }])
      ),
      lng: DEFAULT_LANGUAGE,
      fallbackLng: DEFAULT_LANGUAGE,
      ns: ['common'],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    })
    .catch((err) => console.error('i18n init error', err));
}

export default i18n;
