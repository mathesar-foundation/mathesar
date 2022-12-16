const vowels = new Set(['a', 'e', 'i', 'o', 'u']);

export function getArticleForWord(word: string): string {
  return vowels.has(word[0]?.toLowerCase()) ? 'an' : 'a';
}

export function makeSingular(word: string): string {
  return word.length > 1 ? word.replace(/s$/i, '') : word;
}
