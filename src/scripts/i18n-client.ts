import { getCurrentLanguage, setLanguage, getTranslations, type Language } from '../utils/i18n';

class I18nClient {
  private currentLanguage: Language;
  private translations: any;

  constructor() {
    this.currentLanguage = getCurrentLanguage();
    this.translations = {};
    this.init();
  }

  private async init() {
    await this.loadTranslations();
    this.updatePageContent();
    this.setupLanguageListener();

    // ✅ Re-aplica traducciones cuando termina la carga (después de hidratar islands)
    window.addEventListener('load', () => this.updatePageContent());

    // ✅ Re-aplica traducciones cuando Astro hace navegación con view-transitions
    document.addEventListener('astro:page-load', () => this.updatePageContent());

    // ✅ Si algún framework añade/re-renderiza nodos (islands), volvemos a traducir
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.addedNodes && m.addedNodes.length) {
          // Solo si aparecen nodos que podrían llevar data-i18n
          for (const n of m.addedNodes) {
            if (n instanceof HTMLElement &&
                (n.hasAttribute('data-i18n') || n.querySelector?.('[data-i18n]'))) {
              this.updateDynamicContent();
              break;
            }
          }
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  private async loadTranslations() {
    try {
      // Load both language files
      const [enResponse, esResponse] = await Promise.all([
        fetch('/src/i18n/en.json'),
        fetch('/src/i18n/es.json')
      ]);

      this.translations = {
        en: await enResponse.json(),
        es: await esResponse.json()
      };
    } catch (error) {
      console.warn('Failed to load translations:', error);
      // Fallback to embedded translations if available
      this.translations = {
        en: (window as any).__TRANSLATIONS__?.en || {},
        es: (window as any).__TRANSLATIONS__?.es || {}
      };
    }
  }

  private setupLanguageListener() {
    window.addEventListener('languageChanged', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.currentLanguage = customEvent.detail;
      this.updatePageContent();
    });
  }

  private updatePageContent() {
    // Update navigation links
    this.updateNavigation();
    
    // Update any other dynamic content
    this.updateDynamicContent();
  }

  private updateNavigation() {
    const navElements = {
      '[data-i18n="nav.features"]': this.t('nav.features'),
      '[data-i18n="nav.pricing"]': this.t('nav.pricing'),
      '[data-i18n="nav.testimonials"]': this.t('nav.testimonials'),
      '[data-i18n="nav.contact"]': this.t('nav.contact'),
      '[data-i18n="nav.signIn"]': this.t('nav.signIn'),
      '[data-i18n="nav.startFree"]': this.t('nav.startFree')
    };

    Object.entries(navElements).forEach(([selector, text]) => {
      const element = document.querySelector(selector);
      if (element) {
        element.textContent = text;
      }
    });
  }

  private updateDynamicContent() {
    // Update all elements with data-i18n attributes
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        const text = this.t(key);
        if (element.tagName === 'INPUT' && element.getAttribute('type') !== 'submit') {
          (element as HTMLInputElement).placeholder = text;
        } else {
          element.textContent = text;
        }
      }
    });
  }

  private t(key: string, fallback?: string): string {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        if (this.currentLanguage !== 'en') {
          let fallbackValue = this.translations.en;
          for (const fk of keys) {
            if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
              fallbackValue = fallbackValue[fk];
            } else {
              return fallback || key;
            }
          }
          return typeof fallbackValue === 'string' ? fallbackValue : fallback || key;
        }
        return fallback || key;
      }
    }

    return typeof value === 'string' ? value : fallback || key;
  }

  public changeLanguage(language: Language) {
    setLanguage(language);
    this.currentLanguage = language;
    this.updatePageContent();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new I18nClient());
} else {
  new I18nClient();
}

// Export for global access
(window as any).i18nClient = I18nClient;
