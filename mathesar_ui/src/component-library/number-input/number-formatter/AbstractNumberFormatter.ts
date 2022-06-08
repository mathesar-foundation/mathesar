import type {
  InputFormatter,
  ParseResult,
} from '@mathesar-component-library-dir/formatted-input/FormattedInputTypes';
import type { PartiallyMissingOrUndefined } from '@mathesar-component-library-dir/types';
import { withDefaults } from '@mathesar-component-library-dir/common/utils';
import type { DerivedOptions, Options } from './options';
import { defaultOptions, getDerivedOptions } from './options';

export default abstract class AbstractNumberFormatter<T>
  implements InputFormatter<T>
{
  opts: DerivedOptions;

  constructor(partialOptions: PartiallyMissingOrUndefined<Options> = {}) {
    this.opts = getDerivedOptions(withDefaults(defaultOptions, partialOptions));
  }

  abstract format(value: T): string;

  abstract parse(input: string): ParseResult<T>;
}
