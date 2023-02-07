import type { CssVariablesObj } from '@mathesar/types';

export function makeStyleStringFromCssVariables(cssVariables: CssVariablesObj) {
  const isCssVariable = (str: string) => str.indexOf('--') === 0;

  return Object.entries(cssVariables)
    .filter((maybeCssVariable) => isCssVariable(maybeCssVariable[0]))
    .map((cssVariable) => `${cssVariable[0]}: ${cssVariable[1]};`)
    .join('');
}
