import { ImmutableSet } from '@mathesar-component-library';

export type TerseHiddenColumns = string[];

export class HiddenColumns extends ImmutableSet<string> {
  constructor(columnIds: Iterable<string> = []) {
    super(columnIds);
  }

  hasColumn(columnId: string) {
    return this.has(columnId);
  }

  withColumn(columnId: string) {
    return this.with(columnId);
  }

  withColumns(columnIds: string[]) {
    return this.union(columnIds);
  }

  withoutColumn(columnId: string) {
    return this.without(columnId);
  }

  withoutColumns(columnIds: string[]) {
    return this.without(columnIds);
  }

  terse(): TerseHiddenColumns {
    return [...this];
  }

  static fromTerse(terse: TerseHiddenColumns) {
    return new HiddenColumns(terse);
  }
}
