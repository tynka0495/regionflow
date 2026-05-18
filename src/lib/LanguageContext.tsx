import { createContext, useContext } from 'react';
import type { Lang } from './i18n';

export const LanguageContext = createContext<Lang>('cs');
export const useLanguage = () => useContext(LanguageContext);
