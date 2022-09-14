import { toAsciiLowerCase } from '@mathesar-component-library-dir/common/utils';
import type { MatchPart } from './matchHighlighterTypes';

export function match(text: string): MatchPart {
  return { text, isMatch: true };
}

export function nonMatch(text: string): MatchPart {
  return { text, isMatch: false };
}

export function splitMatchParts(text: string, substring: string): MatchPart[] {
  if (text.length === 0) {
    return [];
  }
  if (substring.length === 0) {
    return [nonMatch(text)];
  }
  const comparableText = toAsciiLowerCase(text);
  const comparableSubstring = toAsciiLowerCase(substring);
  const matchParts: MatchPart[] = [];
  let startIndex = 0;
  while (true) {
    const matchIndex = comparableText.indexOf(comparableSubstring, startIndex);
    if (matchIndex === -1) {
      if (startIndex < comparableText.length) {
        matchParts.push(nonMatch(text.slice(startIndex)));
      }
      break;
    }
    if (matchIndex > startIndex) {
      matchParts.push(nonMatch(text.substring(startIndex, matchIndex)));
    }
    matchParts.push(
      match(text.substring(matchIndex, matchIndex + substring.length)),
    );
    startIndex = matchIndex + substring.length;
  }
  return matchParts;
}
