export type Language = 'en' | 'ja' | 'de';

export interface LangObject {
  language: Language;
  dictionary: LanguageDictionary;
}

export function addTranslationsToGlobalWindowObject({
  language,
  dictionary,
}: LangObject) {
  window.Mathesar = {
    ...window.Mathesar,
    translations: {
      ...window.Mathesar?.translations,
      [language]: dictionary,
    },
  };
}
