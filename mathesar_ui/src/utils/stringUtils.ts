const htmlTokenReplacementMap = new Map([
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ["'", '&#39;'],
  ['"', '&quot;'],
]);
const htmlTokens = new RegExp(
  `[${[...htmlTokenReplacementMap.keys()].join('')}]`,
  'g',
);

function replaceHtmlToken(char: string) {
  return htmlTokenReplacementMap.get(char) ?? '';
}

export function escapeHtml(str: string) {
  return str.replace(htmlTokens, replaceHtmlToken);
}
