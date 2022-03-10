import type {
  InputFormatter,
  ParseResult,
} from '@mathesar-component-library-dir/common/utils/InputFormatter';
import { factoryToNormalize } from './cleaners';
import { makeFormatter } from './formatter';
import type { DerivedOptions, Options } from './options';
import { defaultOptions, getDerivedOptions } from './options';

function getParsedValue(normalizedInput: string): number | undefined {
  // Why use `parseFloat` instead of `parseInt` in cases where we know we should
  // have an Int? Because we already strip out the decimal separator when
  // normalizing the input for an expected integer, and all numbers are floats
  // in javascript anyway.
  const value = parseFloat(normalizedInput);
  if (Number.isNaN(value)) {
    return undefined;
  }
  return value;
}

export default class NumberFormatter implements InputFormatter<number> {
  opts: DerivedOptions;

  constructor(partialOptions: Partial<Options> = {}) {
    this.opts = getDerivedOptions({
      ...defaultOptions,
      ...partialOptions,
    });
  }

  format(value: number): string {
    return makeFormatter(this.opts)(value);
  }

  private getIntermediateDisplay(
    normalizedInput: string,
    parsedValue: number | undefined,
  ): string {
    if (parsedValue === undefined) {
      return normalizedInput;
    }
    const format = makeFormatter({
      ...this.opts,
      // Need zeros entered after decimal so that the user can continue typing
      minimumFractionDigits: (normalizedInput.split('.')[1] ?? '').length,
      // Need to retain trailing decimal so that the user can continue typing
      forceTrailingDecimal: !!/\.$/.exec(normalizedInput),
    });
    return format(parsedValue);
  }

  parse(input: string): ParseResult<number> {
    const normalize = factoryToNormalize(this.opts);
    const normalizedInput = normalize(input);
    const value = getParsedValue(normalizedInput);
    return {
      value,
      intermediateDisplay: this.getIntermediateDisplay(normalizedInput, value),
    };
  }
}
