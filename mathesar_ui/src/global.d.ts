/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.mdx' {
  const value: string;
  export default value;
}

interface Window {
  translations: { lang: Locales; translationStrings: string } | undefined;
}
