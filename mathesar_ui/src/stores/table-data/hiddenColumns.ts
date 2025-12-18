import { ImmutableSet } from '@mathesar-component-library';

export type TerseHiddenColumns = string[];

export class HiddenColumns extends ImmutableSet<string> {
  constructor(columnIds: Iterable<string> = []) {
    super(columnIds);
  }

  hasColumn(columnId: string): boolean {
    return this.has(columnId);
  }

  withColumn(columnId: string): HiddenColumns {
    return this.with(columnId) as HiddenColumns;
  }

  withColumns(columnIds: string[]): HiddenColumns {
    return this.union(columnIds) as HiddenColumns;
  }

  withoutColumn(columnId: string): HiddenColumns {
    return this.without(columnId) as HiddenColumns;
  }

  withoutColumns(columnIds: string[]): HiddenColumns {
    return this.without(columnIds) as HiddenColumns;
  }

  terse(): TerseHiddenColumns {
    return [...this];
  }

  static fromTerse(terse: TerseHiddenColumns): HiddenColumns {
    return new HiddenColumns(terse);
  }
}
