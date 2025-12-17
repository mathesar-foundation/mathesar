import type {
  InputFormatter,
  ParseResult,
} from '@mathesar-component-library/types';

export class UriFormatter implements InputFormatter<string | null> {
  parse(input: string): ParseResult<string | null> {
    const cleanedInput = input.trim();

    if (!cleanedInput) {
      return { value: null, intermediateDisplay: input };
    }

    return { value: cleanedInput, intermediateDisplay: input };
  }

  format(value: string | null): string {
    if (value == null) return '';
    return value;
  }
}
