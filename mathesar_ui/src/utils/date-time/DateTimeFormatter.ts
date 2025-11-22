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

    return { value: value.trim() ? value : null, intermediateDisplay };
  }

  format(canonicalDateStringOrUserInput: string): string {
    // Some date strings that PostgreSQL accepts are not safely representable
    // via JavaScript `Date`/dayjs (for example: years with leading zeros
    // like `0200`, BC dates with a trailing `BC`, or years with more than
    // 4 digits). Attempting to parse/format these with dayjs can produce
    // incorrect/mangled output in the UI. To avoid that, only attempt to
    // parse+format when the year portion is a plain 4-digit AD year.
    // Otherwise, return the original canonical string unchanged so the UI
    // displays the API value verbatim.
    const trimmed = String(canonicalDateStringOrUserInput).trim();

    // If it explicitly contains a BC/AD marker, don't try to reformat.
    if (/\bBC\b|\bAD\b/i.test(trimmed)) return canonicalDateStringOrUserInput;

    // Match ISO-like leading year (may be negative or multi-digit). We only
    // allow exactly 4-digit non-negative years to be formatted by dayjs.
    const isoYearMatch = trimmed.match(/^(-?\d+)-\d{2}-\d{2}(?:$|\s)/);
    if (isoYearMatch) {
      const yearStr = isoYearMatch[1];
      // Disallow years with leading zeros (e.g. `0200`) or years that are
      // not exactly four digits. Only allow 4-digit years that don't start
      // with `0` (i.e., AD years from 1000..9999) to be formatted.
      if (!/^[1-9]\d{3}$/.test(yearStr)) {
        return canonicalDateStringOrUserInput;
      }
    }

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
