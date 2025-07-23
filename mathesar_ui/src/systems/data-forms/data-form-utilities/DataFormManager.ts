/* eslint-disable max-classes-per-file */

import { type Readable, type Writable, writable } from 'svelte/store';

import type { Schema } from '@mathesar/models/Schema';
import { Table } from '@mathesar/models/Table';
import { TableStructure } from '@mathesar/stores/table-data';
import type CacheManager from '@mathesar/utils/CacheManager';

import { EphemeralDataForm } from './EphemeralDataForm';
import type { EphemeralDataFormField, EphemeralDataFormProps } from './types';

export interface DataFormManager {
  ephemeralDataForm: EphemeralDataForm;
}

export class ReadonlyDataFormManager implements DataFormManager {
  ephemeralDataForm;

  constructor(ephemeralDataFormProps: EphemeralDataFormProps) {
    this.ephemeralDataForm = new EphemeralDataForm(ephemeralDataFormProps);
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

export class EditableDataFormManager implements DataFormManager {
  ephemeralDataForm;

  private _selectedElement: Writable<SelectedElement | undefined> = writable();

  get selectedElement(): Readable<SelectedElement | undefined> {
    return this._selectedElement;
  }

  readonly schema: Schema;

  private tableStructureCache;

  private _hasChanges = writable(false);

  get hasChanges(): Readable<boolean> {
    return this._hasChanges;
  }

  constructor(
    ephemeralDataFormProps: EphemeralDataFormProps,
    schema: Schema,
    tableStructureCache: CacheManager<Table['oid'], TableStructure>,
  ) {
    this.ephemeralDataForm = new EphemeralDataForm(
      ephemeralDataFormProps,
      (e) => {
        this._hasChanges.set(true);
      },
    );
    this.schema = schema;
    this.tableStructureCache = tableStructureCache;
  }

  selectElement(element: SelectedElement) {
    this._selectedElement.set(element);
  }

  resetSelectedElement() {
    this._selectedElement.set(undefined);
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
}

/* eslint-enable max-classes-per-file */
