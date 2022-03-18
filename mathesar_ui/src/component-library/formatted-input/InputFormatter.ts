export interface ParseResult<T> {
  value: T | undefined;
  intermediateDisplay: string;
}

export interface InputFormatter<T> {
  format(value: T): string;

  /**
   * @throws Error if unable to parse
   */
  parse(input: string): ParseResult<T>;
}
