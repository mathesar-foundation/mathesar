export function fractionDigitCount(simplifiedInput: string): number {
  return (simplifiedInput.split('.')[1] ?? '').length;
}

export function hasTrailingDecimal(simplifiedInput: string): boolean {
  return simplifiedInput.endsWith('.');
}
