import type { ParseResult } from '@mathesar-component-library-dir/formatted-input/FormattedInputTypes';
import AbstractNumberFormatter from './AbstractNumberFormatter';
import { makeFormatter } from './formatter';
import { makeUniversalNumberParser } from './parsers';

export default class NumberFormatter extends AbstractNumberFormatter<number> {
  format(value: number): string {
    return makeFormatter(this.opts)(value);
  }

  parse(input: string): ParseResult<number> {
    const result = makeUniversalNumberParser(this.opts)(input);
    if (result.value === null) {
      return {
        value: null,
        intermediateDisplay: result.intermediateDisplay,
      };
    }
    if (result.value.type !== 'number') {
      throw new Error(
        'Number input could not be accurately parsed to a JavaScript number ' +
          'without loss of precision.',
      );
    }
    return {
      value: result.value.numericalValue,
      intermediateDisplay: result.intermediateDisplay,
    };
  }
}
