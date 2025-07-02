/* eslint-disable max-classes-per-file */

import { type Writable, writable } from 'svelte/store';

import type { Schema } from '@mathesar/models/Schema';
import { Table } from '@mathesar/models/Table';
import { TableStructure } from '@mathesar/stores/table-data';
import type CacheManager from '@mathesar/utils/CacheManager';

import type { EdfUpdateDiff, EphemeralDataForm } from './EphemeralDataForm';

export interface DataFormManager {
  ephemeralDataForm: EphemeralDataForm;
}

export class ReadonlyDataFormManager implements DataFormManager {
  ephemeralDataForm;

  constructor(ephemeralDataForm: EphemeralDataForm) {
    this.ephemeralDataForm = ephemeralDataForm;
  }
}

export class EditableDataFormManager extends ReadonlyDataFormManager {
  selectedElement: Writable<string | undefined> = writable();

  private schema: Schema;

  private tableStructureCache;

  constructor(
    ephemeralDataForm: EphemeralDataForm,
    schema: Schema,
    tableStructureCache: CacheManager<Table['oid'], TableStructure>,
  ) {
    super(ephemeralDataForm);
    this.schema = schema;
    this.tableStructureCache = tableStructureCache;
  }

  selectElement(elementId: string) {
    this.selectedElement.set(elementId);
  }

  getTableStructure(tableOrOid: Table | number) {
    const isTableInstance = tableOrOid instanceof Table;
    const tableOid = isTableInstance ? tableOrOid.oid : tableOrOid;
    const schema = isTableInstance ? tableOrOid.schema : this.schema;

    return this.tableStructureCache.get(
      tableOid,
      () =>
        new TableStructure({
          oid: tableOid,
          schema,
        }),
    );
  }

  async update(
    callback: (edf: EphemeralDataForm) => EdfUpdateDiff,
  ): Promise<void> {
    const { change } = callback(this.ephemeralDataForm);
    // Run side-effects based on the change
  }
}

/* eslint-enable max-classes-per-file */
