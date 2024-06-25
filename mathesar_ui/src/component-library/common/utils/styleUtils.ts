import type { CssVariablesObj } from '@mathesar-component-library-dir/types';

import { isDefinedNonNullable } from './typeUtils';

const isCssVariable = (str: string) => str.indexOf('--') === 0;

export function makeStyleStringFromCssVariables(cssVariables: CssVariablesObj) {
  return Object.entries(cssVariables)
    .filter((maybeCssVariable) => isCssVariable(maybeCssVariable[0]))
    .map((cssVariable) => `${cssVariable[0]}: ${cssVariable[1]};`)
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
