import type { ParseResult } from '@mathesar-component-library-dir/formatted-input/FormattedInputTypes';
import AbstractNumberFormatter from './AbstractNumberFormatter';
import { makeFormatter } from './formatter';
import { makeUniversalNumberParser } from './parsers';

export default class StringifiedNumberFormatter extends AbstractNumberFormatter<string> {
  format(canonicalStringifiedNumber: string): string {
    const parseCanonical = makeUniversalNumberParser({
      ...this.opts,
      // Override the decimal separator because we're parsing a canonical
      // stringified number.
      decimalSeparator: '.',
    });
    const parseResult = parseCanonical(canonicalStringifiedNumber);
    switch (parseResult.value?.type) {
      case 'bigfloat':
        return parseResult.value.normalizedStringifiedNumber;
      case 'number':
      case 'bigint':
        return makeFormatter(this.opts)(parseResult.value.numericalValue);
      default:
        return '';
    }
  }

  parse(userInput: string): ParseResult<string> {
    const parseUserInput = makeUniversalNumberParser(this.opts);
    const result = parseUserInput(userInput);
    return {
      value: result.value?.normalizedStringifiedNumber ?? null,
      intermediateDisplay: result.intermediateDisplay,
    };
  }
}
