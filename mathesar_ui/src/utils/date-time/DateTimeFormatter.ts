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

  parse(userInputOrServerResponse: string): ParseResult<string> {
    const formattingOptions = [
      this.specification.getFormattingString(),
      ...this.specification.getCommonFormattingStrings(),
      ...this.specification.getCanonicalFormattingStrings(),
    ];

    let value = dayjs(userInputOrServerResponse, formattingOptions, true);

    if (!value.isValid()) {
      // Try parsing only in canonical format if general formatting fails
      value = dayjs(
        userInputOrServerResponse,
        this.specification.getCanonicalFormattingStrings(),
      );
    }

    return {
      value: value.isValid()
        ? this.specification.getCanonicalString(value.toDate())
        : userInputOrServerResponse,
      intermediateDisplay: userInputOrServerResponse,
    };
  }

  format(canonicalDateStringOrUserInput: string): string {
    const value = dayjs(
      canonicalDateStringOrUserInput,
      this.specification.getCanonicalFormattingStrings(),
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
