import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';
import es from './locales/es.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import pt from './locales/pt.json';
import bn from './locales/bn.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';
import fr from './locales/fr.json';

const langMap = {
  zh: 'zh-CN',
  es: 'es',
  ar: 'ar',
  hi: 'hi',
  pt: 'pt',
  bn: 'bn',
  ru: 'ru',
  ja: 'ja',
  fr: 'fr',
};

function detectLanguage() {
  const lang = navigator.language;
  if (lang.startsWith('zh')) return 'zh-CN';
  const prefix = lang.split('-')[0];
  return langMap[prefix] || 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'zh-CN': { translation: zhCN },
    es: { translation: es },
    ar: { translation: ar },
    hi: { translation: hi },
    pt: { translation: pt },
    bn: { translation: bn },
    ru: { translation: ru },
    ja: { translation: ja },
    fr: { translation: fr },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
