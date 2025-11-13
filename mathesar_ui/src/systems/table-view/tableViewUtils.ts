import type {
  ProcessedColumn,
  RelatedColumn,
} from '@mathesar/stores/table-data';

export function* getCustomizedColumnWidths(
  columns: Iterable<ProcessedColumn | RelatedColumn>,
) {
  for (const column of columns) {
    const width = column.column.metadata?.display_width;
    if (!width) continue;
    const entry: [number | string, number] = [column.id, width];
    yield entry;
  }
}
