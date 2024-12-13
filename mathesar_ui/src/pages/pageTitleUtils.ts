import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

const SEPARATOR = ' | ';

function makePageTitle(parts: string[]): string {
  const allParts = [...parts];
  allParts.push(get(_)('mathesar'));
  return allParts.join(SEPARATOR);
}

export function makeSimplePageTitle(str: string): string {
  return makePageTitle([str]);
}
