import type { CssVariablesObj } from '@mathesar/types';
import { truthy } from './typeUtils';

export function makeStyleStringFromCssVariables(cssVariables: CssVariablesObj) {
  const isCssVariable = (str: string) => str.indexOf('--') === 0;

  return Object.entries(cssVariables)
    .filter((maybeCssVariable) => isCssVariable(maybeCssVariable[0]))
    .map((cssVariable) => `${cssVariable[0]}: ${cssVariable[1]};`)
    .join('');
}

export function mergeStyleStrings(...args: (string | undefined)[]) {
  return args.filter(truthy).map((styleString) => {
    const trimmedStyleString = styleString.trim();
    if (trimmedStyleString.endsWith(";")) {
      return trimmedStyleString;
    } else {
      return trimmedStyleString + ";"
    }
  }).join("")
}