import enTranslations from '../i18n/en.json';
import esTranslations from '../i18n/es.json';

export type Language = 'en' | 'es';
export type TranslationKey = string;

const translations = {
  en: enTranslations,
  es: esTranslations,
} as const;

export const DEFAULT_LANGUAGE: Language = 'en';
export const SUPPORTED_LANGUAGES: Language[] = ['en', 'es'];

export const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Español',
} as const;

// Get nested translation value using dot notation (e.g., 'nav.features')
export function getTranslation(
  language: Language,
  key: TranslationKey,
  fallback?: string
): string {
  const keys = key.split('.');
  let value: any = translations[language];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if key not found in current language
      if (language !== DEFAULT_LANGUAGE) {
        return getTranslation(DEFAULT_LANGUAGE, key, fallback);
      }
      return fallback || key;
    }
  }

  return typeof value === 'string' ? value : fallback || key;
}

// Get current language from localStorage or default
export function getCurrentLanguage(): Language {
  // Always return default language on server-side
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  try {
    const stored = localStorage.getItem('language');
    if (stored && SUPPORTED_LANGUAGES.includes(stored as Language)) {
      return stored as Language;
    }
    
    // Always default to English on first visit - don't auto-detect browser language
    return DEFAULT_LANGUAGE;
  } catch (error) {
    console.warn('Error accessing localStorage:', error);
  }
  
  return DEFAULT_LANGUAGE;
}

// Set language and persist to localStorage
export function setLanguage(language: Language): void {
  if (typeof window === 'undefined') return;
  
  if (SUPPORTED_LANGUAGES.includes(language)) {
    localStorage.setItem('language', language);
    // Update document lang attribute
    document.documentElement.lang = language;
    // Trigger custom event for components to react
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
  }
}

// Create translation function for a specific language
export function createTranslator(language: Language) {
  return (key: TranslationKey, fallback?: string) => 
    getTranslation(language, key, fallback);
}

// Get all translations for a language
export function getTranslations(language: Language) {
  return translations[language];
}

// Check if a language is supported
export function isLanguageSupported(language: string): language is Language {
  return SUPPORTED_LANGUAGES.includes(language as Language);
}
