/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.mdx' {
  const value: string;
  export default value;
}

interface LanguageDictionary {
  [key: string]: LanguageDictionary | string | null;
}

interface Window {
  Mathesar:
    | {
        translations: {
          en?: LanguageDictionary;
          ja?: LanguageDictionary;
        };
      }
    | undefined;
}
