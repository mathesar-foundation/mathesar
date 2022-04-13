import type { ParseResult } from '@mathesar-component-library-dir/formatted-input/InputFormatter';
import AbstractNumberFormatter from './AbstractNumberFormatter';
import { makeFormatter } from './formatter';
import { makeUniversalNumberParser } from './parsers';

export default class StringifiedNumberFormatter extends AbstractNumberFormatter<string> {
  format(value: string): string {
    const parseResult = makeUniversalNumberParser(this.opts)(value);
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

  parse(input: string): ParseResult<string> {
    const result = makeUniversalNumberParser(this.opts)(input);
    return {
      value: result.value?.normalizedStringifiedNumber ?? null,
      intermediateDisplay: result.intermediateDisplay,
    };
  }
}
