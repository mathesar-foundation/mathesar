import type { GetRequestParams } from '@mathesar/api/tables/records';
import { ImmutableSet } from '@mathesar/component-library';

/** Each value is a column name */
export type TerseGrouping = string[];

/** Each value is a column name. */
export class Grouping extends ImmutableSet<string> {
  recordsRequestParams(): Pick<GetRequestParams, 'grouping'> {
    if (!this.size) {
      return {};
    }
    return {
      grouping: { columns: [...this] },
    };
  }

  terse(): TerseGrouping {
    return [...this];
  }

  static fromTerse(terse: TerseGrouping): Grouping {
    return new Grouping(terse);
  }
}
