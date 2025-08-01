/* eslint-disable max-classes-per-file */

import { type Readable, type Writable, get, writable } from 'svelte/store';

import type { Schema } from '@mathesar/models/Schema';
import { Table } from '@mathesar/models/Table';
import { TableStructure } from '@mathesar/stores/table-data';
import type CacheManager from '@mathesar/utils/CacheManager';

import { DataFormStructure } from './DataFormStructure';
import type { DataFormStructureProps, EphemeralDataFormField } from './types';

export interface DataFormManager {
  dataFormStructure: DataFormStructure;
}

export class ReadonlyDataFormManager implements DataFormManager {
  dataFormStructure;

  constructor(props: DataFormStructureProps) {
    this.dataFormStructure = new DataFormStructure(props);
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
  dataFormStructure;

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
    structureProps: DataFormStructureProps,
    schema: Schema,
    tableStructureCache: CacheManager<Table['oid'], TableStructure>,
  ) {
    this.dataFormStructure = new DataFormStructure(structureProps, (e) => {
      if (e.prop === 'fields' || e.prop === 'nestedFields') {
        if (e.detail.type === 'add') {
          this.selectElement({
            type: 'field',
            field: e.detail.field,
          });
        } else if (e.detail.type === 'delete') {
          const currentSelectedElement = get(this.selectedElement);
          if (
            currentSelectedElement?.type === 'field' &&
            currentSelectedElement.field === e.detail.field
          ) {
            this.resetSelectedElement();
          }
        }
      }
      this._hasChanges.set(true);
    });
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
