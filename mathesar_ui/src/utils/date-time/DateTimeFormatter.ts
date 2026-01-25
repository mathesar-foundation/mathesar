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

function makeLooseVariants(formats: string[]): string[] {
  const variants = new Set<string>();

  for (const f of formats) {
    variants.add(f);

    if (f.includes('HH')) {
      variants.add(f.replace(/HH/g, 'H'));
    }

    if (f.includes(':ss')) {
      variants.add(f.replace(':ss', ''));
      variants.add(f.replace(':ss.Z', ''));
      variants.add(f.replace(':ss Z', ''));
      variants.add(f.replace(':ssZZ', ''));
    }

    if (f.includes('T')) {
      variants.add(f.replace('T', ' '));
    } else if (f.includes(' ')) {
      variants.add(f.replace(' ', 'T'));
    }
  }

  return Array.from(variants);
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

  const looseFormats = makeLooseVariants(allFormats);

  const strictResult = dayjs(input, looseFormats, true);
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
    let dayjsValue =
      parseKeywords(input) ?? parseWithSpec(input, this.specification);

    if (!dayjsValue) {
      const permissive = dayjs(input);
      if (permissive.isValid()) {
        dayjsValue = permissive;
      }
    }

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
