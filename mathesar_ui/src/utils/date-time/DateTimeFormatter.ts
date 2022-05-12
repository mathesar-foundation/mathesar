import { dayjs, isDefinedNonNullable } from '@mathesar-component-library';
import type {
  InputFormatter,
  ParseResult,
} from '@mathesar-component-library/types';
import type DateTimeSpecification from './DateTimeSpecification';

export default class DateTimeFormatter implements InputFormatter<string> {
  specification: DateTimeSpecification;

  constructor(specification: DateTimeSpecification) {
    this.specification = specification;
  }

  parse(userInput: string): ParseResult<string> {
    const value = dayjs(
      userInput,
      [
        this.specification.getFormattingString(),
        ...this.specification.getCommonFormattingStrings(),
        ...this.specification.getCanonicalFormattingStrings(),
      ],
      true,
    );

    return {
      value: value.isValid()
        ? this.specification.getCanonicalString(value.toDate())
        : userInput,
      intermediateDisplay: userInput,
    };
  }

  format(canonicalDateStringOrUserInput: string): string {
    const value = dayjs(
      canonicalDateStringOrUserInput,
      this.specification.getCanonicalFormattingStrings(),
      true,
    );
    if (value.isValid()) {
      return value.format(this.specification.getFormattingString());
    }
    return canonicalDateStringOrUserInput;
  }

  parseAndFormat(anyString: string): string {
    const { value } = this.parse(anyString);
    if (isDefinedNonNullable(value)) {
      return this.format(value);
    }
    return anyString;
  }
}
