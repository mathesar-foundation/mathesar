/* eslint-disable max-classes-per-file */

import { type Writable, writable } from 'svelte/store';

import type { Schema } from '@mathesar/models/Schema';
import { Table } from '@mathesar/models/Table';
import { TableStructure } from '@mathesar/stores/table-data';
import type CacheManager from '@mathesar/utils/CacheManager';

import type { EphemeralDataFormField } from './AbstractEphemeralField';
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

interface SelectedStaticElement {
  type: 'title' | 'subtitle';
}

interface SelectedFieldElement {
  type: 'field';
  field: EphemeralDataFormField;
}

export type SelectedElement = SelectedStaticElement | SelectedFieldElement;

export class EditableDataFormManager extends ReadonlyDataFormManager {
  selectedElement: Writable<SelectedElement | undefined> = writable();

  // TODO: Remove this after Reverse FK is enabled
  reverseForeignKeyEnabled = false;

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

  selectElement(element: SelectedElement) {
    this.selectedElement.set(element);
  }

  resetSelectedElement() {
    this.selectedElement.set(undefined);
  }

  getTableStructure(tableOrOid: Table | number) {
    const isTableInstance = tableOrOid instanceof Table;
    const tableStructureProps = isTableInstance
      ? tableOrOid
      : {
          oid: tableOrOid,
          schema: this.schema,
        };

    return this.tableStructureCache.get(
      tableStructureProps.oid,
      () => new TableStructure(tableStructureProps),
    );
  }

  insertField(ef: EphemeralDataFormField) {
    if (ef.parentField) {
      ef.parentField.nestedFields.add(ef);
    } else {
      this.ephemeralDataForm.fields.add(ef);
    }
    this.selectElement({
      type: 'field',
      field: ef,
    });
  }

  removeField(ef: EphemeralDataFormField) {
    if (ef.parentField) {
      ef.parentField.nestedFields.delete(ef);
    } else {
      this.ephemeralDataForm.fields.delete(ef);
    }
  }

  async update(
    callback: (edf: EphemeralDataForm) => EdfUpdateDiff,
  ): Promise<void> {
    const { change } = callback(this.ephemeralDataForm);
    // Run side-effects based on the change
  }
}

/* eslint-enable max-classes-per-file */
