import type {
  InputFormatter,
  ParseResult,
} from '@mathesar-component-library/types';

// We use <string | null> to allow null values without red lines
export class EmailFormatter implements InputFormatter<string | null> {
  parse(input: string): ParseResult<string | null> {
    const cleanedInput = input.trim();

    // THE FIX: If empty, return NULL
    if (!input || cleanedInput === '') {
      return { value: null, intermediateDisplay: input };
    }

    return { value: cleanedInput, intermediateDisplay: input };
  }

  format(value: string | null): string {
    // Handle null safely for display
    if (value == null) return '';
    return value;
  }
}
