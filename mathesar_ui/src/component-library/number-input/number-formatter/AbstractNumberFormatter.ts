import type {
  InputFormatter,
  ParseResult,
} from '@mathesar/component-library/formatted-input/InputFormatter';
import type { DerivedOptions, Options } from './options';
import { defaultOptions, getDerivedOptions } from './options';

export default abstract class AbstractNumberFormatter<T>
  implements InputFormatter<T>
{
  opts: DerivedOptions;

  constructor(partialOptions: Partial<Options> = {}) {
    this.opts = getDerivedOptions({
      ...defaultOptions,
      ...partialOptions,
    });
  }

  abstract format(value: T): string;

  abstract parse(input: string): ParseResult<T>;
}
