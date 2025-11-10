declare global {
  interface Window {
    toggleTheme: () => void;
    __TRANSLATIONS__: {
      en: any;
      es: any;
    };
  }
}

export {};
