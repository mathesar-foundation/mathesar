import { dayjs, isDefinedNonNullable } from '@mathesar-component-library';
import type {
  InputFormatter,
  ParseResult,
} from '@mathesar-component-library/types';
import type DateTimeSpecification from './DateTimeSpecification';

function tryPresetParsing(input: string, formattingString: string): string {
  switch (input) {
    case 'now':
    case 'Now':
      return dayjs().format(formattingString);
    case 'today':
    case 'Today':
      return dayjs().format(formattingString);
    case 'yesterday':
    case 'Yesterday':
      return dayjs().startOf('day').subtract(1, 'day').format(formattingString);
    case 'tomorrow':
    case 'Tomorrow':
      return dayjs().startOf('day').add(1, 'day').format(formattingString);
    default:
      return input;
  }
}

export default class DateTimeFormatter implements InputFormatter<string> {
  specification: DateTimeSpecification;

  constructor(specification: DateTimeSpecification) {
    this.specification = specification;
  }

  parse(userInputOrServerResponse: string): ParseResult<string> {
    if (
      userInputOrServerResponse === '' ||
      userInputOrServerResponse === 'null'
    ) {
      return {
        value: null,
        intermediateDisplay: userInputOrServerResponse,
      };
    }
    const formattingOptions = [
      this.specification.getFormattingString(),
      ...this.specification.getCommonFormattingStrings(),
      ...this.specification.getCanonicalFormattingStrings(),
      ...this.specification.getAdditionalFormattingStrings(),
    ];

    let value = dayjs(userInputOrServerResponse, formattingOptions, true);

    if (!value.isValid()) {
      // Try parsing only in canonical format if general formatting fails
      value = dayjs(
        userInputOrServerResponse,
        this.specification.getCanonicalFormattingStrings(),
      );
    }

    // try formatting for presets (now, tomorrow, yesterday)
    const formattingString = this.specification.getFormattingString();
    const preset = tryPresetParsing(
      userInputOrServerResponse,
      formattingString,
    );

    value = dayjs(preset, formattingOptions, true);

    if (!value.isValid()) {
      throw new Error('Date parsing failed.');
    }

    return {
      value: this.specification.getCanonicalString(value.toDate()),
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
