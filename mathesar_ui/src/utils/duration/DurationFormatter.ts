import type {
  InputFormatter,
  ParseResult,
} from '@mathesar-component-library/types';
import type DurationSpecification from './DurationSpecification';

export default class DurationFormatter implements InputFormatter<string> {
  specification: DurationSpecification;

  constructor(specification: DurationSpecification) {
    this.specification = specification;
  }

  parse(input: string): ParseResult<string> {
    const format = this.specification.getFormattingString();
    return {
      value: null,
      intermediateDisplay: '',
    };
  }

  format(value: string): string {
    const format = this.specification.getFormattingString();
    return '';
  }
}
