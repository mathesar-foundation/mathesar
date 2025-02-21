import type { ProcessedColumn } from '@mathesar/stores/table-data';

export function* getCustomizedColumnWidths(columns: Iterable<ProcessedColumn>) {
  for (const column of columns) {
    const width = column.column.metadata?.display_width;
    if (!width) continue;
    const entry: [number, number] = [column.id, width];
    yield entry;
  }
}
