import { type Writable, writable } from 'svelte/store';

import type { Table } from '@mathesar/models/Table';
import type { TableStructure } from '@mathesar/stores/table-data';
import type CacheManager from '@mathesar/utils/CacheManager';

import type { EdfUpdateDiff, EphemeralDataForm } from './EphemeralDataForm';

export class DataFormManager {
  ephemeralDataForm;

  selectedElement: Writable<string | undefined> = writable();

  tableStructureCache;

  constructor(
    ephemeralDataForm: EphemeralDataForm,
    tableStructureCache: CacheManager<Table['oid'], TableStructure>,
  ) {
    this.ephemeralDataForm = ephemeralDataForm;
    this.tableStructureCache = tableStructureCache;
  }

  selectElement(elementId: string) {
    this.selectedElement.set(elementId);
  }

  async update(
    callback: (edf: EphemeralDataForm) => EdfUpdateDiff,
  ): Promise<void> {
    const { change } = callback(this.ephemeralDataForm);
    // Run side-effects based on the change
  }
}
