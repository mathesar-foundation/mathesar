const vowels = new Set(['a', 'e', 'i', 'o', 'u']);

export function getArticleForWord(word: string): string {
  return vowels.has(word[0]?.toLowerCase()) ? 'an' : 'a';
}
