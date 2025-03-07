import { dayjs, isDefinedNonNullable } from '@mathesar-component-library';
import type {
  InputFormatter,
  ParseResult,
} from '@mathesar-component-library/types';

import type DateTimeSpecification from './DateTimeSpecification';

type Dayjs = ReturnType<typeof dayjs>;

/**
 * This function converts the following keywords to their respective date/time
 * values:
 *
 * - now
 * - today
 * - tomorrow
 * - yesterday
 *
 * PostgreSQL understands these keywords, so why parse them on the front end?
 * Because the front end might be in a different timezone than the database. If
 * the user enters "now" in the front end, we need to represent that instant
 * from the perspective of the user's timezone, not the server's timezone. And if
 * we simply pass "now" to the server, it will interpret it in the server's
 * timezone.
 *
 * See: https://github.com/mathesar-foundation/mathesar/issues/1694
 */
function parseKeywords(input: string): Dayjs | undefined {
  switch (input.trim().toLowerCase()) {
    case 'now':
      return dayjs();
    case 'today':
      return dayjs().startOf('day');
    case 'tomorrow':
      return dayjs().startOf('day').add(1, 'day');
    case 'yesterday':
      return dayjs().startOf('day').subtract(1, 'day');
    default:
      return undefined;
  }
}

function parseWithSpec(
  input: string,
  spec: DateTimeSpecification,
): Dayjs | undefined {
  const canonicalFormats = spec.getCanonicalFormattingStrings();
  const allFormats = [
    spec.getFormattingString(),
    ...spec.getCommonFormattingStrings(),
    ...canonicalFormats,
  ];

  const strictResult = dayjs(input, allFormats, true);
  if (strictResult.isValid()) return strictResult;

  const canonicalResult = dayjs(input, canonicalFormats);
  if (canonicalResult.isValid()) return canonicalResult;

  return undefined;
}

export default class DateTimeFormatter implements InputFormatter<string> {
  specification: DateTimeSpecification;

  constructor(specification: DateTimeSpecification) {
    this.specification = specification;
  }

  /**
   * @param input could come from the user or from an API response
   */
  parse(input: string): ParseResult<string> {
    const dayjsValue =
      parseKeywords(input) ?? parseWithSpec(input, this.specification);

    const value = (() => {
      if (dayjsValue) {
        // If we were able to parse the input, then we return the canonical
        // string representation of the date/time.
        return this.specification.getCanonicalString(dayjsValue.toDate());
      }

      // If we were _not_ able to parse the input, then we fall back to
      // returning the input as is. This behavior is necessary because
      // PostgreSQL can parse many different formats that we can't (yet?) parse
      // on the front end.
      return input;
    })();

    // Do not do any formatting as the user types
    const intermediateDisplay = input;

    return { value, intermediateDisplay };
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
