import type { GetRequestParams } from '@mathesar/api/tables/records';
import { ImmutableSet } from '@mathesar/component-library';

/** Each value is a column id */
export type TerseGrouping = number[];

/** Each value is a column id. */
export class Grouping extends ImmutableSet<number> {
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
