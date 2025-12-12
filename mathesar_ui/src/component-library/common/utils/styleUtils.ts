import type { CssVariablesObj } from '@mathesar-component-library-dir/types';

import { isDefinedNonNullable } from './typeUtils';

const isCssVariable = (str: string) => str.indexOf('--') === 0;

export function makeStyleString(css: Record<string, string>) {
  return Object.entries(css)
    .map(([property, value]) => `${property}: ${value};`)
    .join('');
}

export function makeStyleStringFromCssVariables(cssVariables: CssVariablesObj) {
  return Object.entries(cssVariables)
    .filter((maybeCssVariable) => isCssVariable(maybeCssVariable[0]))
    .map(([property, value]) => `${property}: ${value};`)
    .join('');
}

export function mergeStyleStrings(...args: (string | undefined)[]) {
  return args
    .filter(isDefinedNonNullable)
    .map((styleString) => {
      const trimmedStyleString = styleString.trim();
      if (trimmedStyleString.endsWith(';')) {
        return trimmedStyleString;
      }
      return `${trimmedStyleString};`;
    })
    .join('');
}
