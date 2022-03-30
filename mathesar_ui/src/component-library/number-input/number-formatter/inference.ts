import type { Options } from './options';

function getFractionDigitCount(simplifiedInput: string): number {
  return (simplifiedInput.split('.')[1] ?? '').length;
}

function hasTrailingDecimal(simplifiedInput: string): boolean {
  return simplifiedInput.endsWith('.');
}

export function inferOptsFromSimplifiedInput(
  simplifiedInput: string,
): Partial<Options> {
  return {
    // Need zeros entered after decimal so that the user can continue typing
    minimumFractionDigits: getFractionDigitCount(simplifiedInput),
    // Need to retain trailing decimal so that the user can continue typing
    forceTrailingDecimal: hasTrailingDecimal(simplifiedInput),
  };
}
