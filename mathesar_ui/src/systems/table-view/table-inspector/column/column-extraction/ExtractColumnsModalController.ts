import { get, writable } from 'svelte/store';
import { _ } from 'svelte-i18n';

import { invalidIf, requiredField } from '@mathesar/components/form';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import { ModalController } from '@mathesar-component-library';

import type { ColumnExtractionTargetType } from './columnExtractionTypes';

export class ExtractColumnsModalController extends ModalController {
  targetType = writable<ColumnExtractionTargetType>('newTable');

  columns = requiredField<ProcessedColumn[]>(
    [],
    [
      invalidIf(
        (columns) => columns.some((column) => column.column.primary_key),
        get(_)('primary_key_column_cannot_be_moved'),
      ),
    ],
  );
}
