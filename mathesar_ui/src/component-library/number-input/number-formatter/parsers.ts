import type { ParseResult } from '@mathesar-component-library-dir/formatted-input/FormattedInputTypes';
import { factoryToNormalize, factoryToSimplify } from './cleaners';
import {
  formatToNormalizedForm,
  makeFormatter,
  factoryToFormatSimplifiedInputForLocale,
} from './formatter';
import { fractionDigitCount, hasTrailingDecimal } from './inference';
import type { DerivedOptions } from './options';

function parseNumber(simplifiedInput: string): number | undefined {
  // Why use `parseFloat` instead of `parseInt` in cases where we know we should
  // have an Int? Because we already strip out the decimal separator when
  // normalizing the input for an expected integer, and all numbers are floats
  // in javascript anyway.
  const value = parseFloat(simplifiedInput);
  if (Number.isNaN(value)) {
    return undefined;
  }
  return value;
}

function parseBigInt(simplifiedInput: string): bigint | undefined {
  try {
    return BigInt(simplifiedInput);
  } catch {
    return undefined;
  }
}

interface BaseParseValue {
  /**
   * A canonical string representation of the number, like you'd see in a JSON
   * string. No grouping separators. ASCII only. Dot for decimal separator.
   */
  normalizedStringifiedNumber: string;
}
export interface SimpleNumberParseValue extends BaseParseValue {
  type: 'number';
  numericalValue: number;
}
export interface BigIntNumberParseValue extends BaseParseValue {
  type: 'bigint';
  numericalValue: bigint;
}
export interface BigFloatParseValue extends BaseParseValue {
  type: 'bigfloat';
}
export type UniversalNumberParseValue =
  | SimpleNumberParseValue
  | BigIntNumberParseValue
  | BigFloatParseValue;

export type UniversalNumberParseResult = ParseResult<UniversalNumberParseValue>;

export type UniversalNumberParser = (
  input: string,
) => UniversalNumberParseResult;

export function makeUniversalNumberParser(
  opts: DerivedOptions,
): UniversalNumberParser {
  function parse(input: string): UniversalNumberParseResult {
    const simplifiedInput = factoryToSimplify(opts)(input);
    const numberValue = parseNumber(simplifiedInput);
    if (numberValue === undefined) {
      return {
        value: null,
        intermediateDisplay: simplifiedInput,
      };
    }
    const normalizedInput = factoryToNormalize(opts)(input);

    const canReformatWithoutLossOfPrecision =
      formatToNormalizedForm(numberValue) === normalizedInput;
    if (canReformatWithoutLossOfPrecision) {
      const roundedNumberValue = Object.is(numberValue, -0)
        ? -0 // Because `toFixed` converts `-0` to `"0"`.
        : parseFloat(numberValue.toFixed(opts.maximumFractionDigits));
      return {
        value: {
          type: 'number',
          numericalValue: roundedNumberValue,
          normalizedStringifiedNumber: roundedNumberValue.toString(),
        },
        intermediateDisplay: makeFormatter({
          ...opts,
          forceTrailingDecimal: hasTrailingDecimal(simplifiedInput),
          minimumFractionDigits: Math.min(
            fractionDigitCount(simplifiedInput),
            opts.maximumFractionDigits,
          ),
        })(roundedNumberValue),
      };
    }

    const bigIntValue = parseBigInt(simplifiedInput);
    if (bigIntValue !== undefined) {
      return {
        value: {
          type: 'bigint',
          numericalValue: bigIntValue,
          normalizedStringifiedNumber: normalizedInput,
        },
        intermediateDisplay: makeFormatter({
          ...opts,
          forceTrailingDecimal: false,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })(bigIntValue),
      };
    }

    return {
      value: {
        type: 'bigfloat',
        normalizedStringifiedNumber: normalizedInput,
      },
      intermediateDisplay:
        factoryToFormatSimplifiedInputForLocale(opts)(simplifiedInput),
    };
  }
  return parse;
}
