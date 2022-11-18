import { ModalController } from '@mathesar-component-library';
import { invalidIf, requiredField } from '@mathesar/components/form';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import { writable } from 'svelte/store';
import type { ColumnExtractionTargetType } from './columnExtractionTypes';

export class ExtractColumnsModalController extends ModalController {
  targetType = writable<ColumnExtractionTargetType>('newTable');

  columns = requiredField<ProcessedColumn[]>(
    [],
    [
      invalidIf(
        (columns) => columns.some((column) => column.column.primary_key),
        'The primary key column cannot be moved.',
      ),
    ],
  );
}
