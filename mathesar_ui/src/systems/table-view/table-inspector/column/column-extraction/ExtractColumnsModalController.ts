import { ModalController } from '@mathesar-component-library';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import { writable } from 'svelte/store';
import type { ColumnExtractionTargetType } from './columnExtractionTypes';

export class ExtractColumnsModalController extends ModalController {
  targetType = writable<ColumnExtractionTargetType>('newTable');

  columns = writable<ProcessedColumn[]>([]);
}
