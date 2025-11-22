import { staticText } from '@mathesar/i18n/staticText';

const SEPARATOR = ' | ';

function makePageTitle(parts: string[]): string {
  const allParts = [...parts];
  allParts.push(staticText.MATHESAR);
  return allParts.join(SEPARATOR);
}

export function makeSimplePageTitle(str: string): string {
  return makePageTitle([str]);
}
