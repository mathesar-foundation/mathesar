export interface ParseResult<T> {
  value: T | undefined;
  intermediateDisplay: string;
}

export interface InputFormatter<T> {
  format(value: T): string;
  parse(input: string): ParseResult<T>;
}
