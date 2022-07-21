import type { TextInputProps } from '@mathesar-component-library-dir/text-input/TextInputTypes';

export interface ParseResult<T> {
  /**
   * See docs within `FormattedInput` for an explanation of how we're using
   * `null` vs `undefined` here.
   *
   * Here we are breaking our convention of `undefined` for empty values. We use
   * `null` here because in `FormattedInput`, a `null` value represents an empty
   * value set by the _user_ (that should get sent to a server) whereas
   * `undefined` represents a value that can only be set by the developer (to
   * indicate that no value should be sent to the server).
   */
  value: T | null;
  intermediateDisplay: string;
}

export interface InputFormatter<T> {
  format(value: T): string;

  /**
   * @throws Error if unable to parse
   */
  parse(input: string): ParseResult<T>;
}

type SimplifiedTextInputProps = Omit<TextInputProps, 'value'>;
type ParseErrorCallback = (p: { userInput: string; error: unknown }) => void;

export interface FormattedInputProps<T> extends SimplifiedTextInputProps {
  formatter: InputFormatter<T>;
  value?: T | null;
  onParseError?: ParseErrorCallback;
}
