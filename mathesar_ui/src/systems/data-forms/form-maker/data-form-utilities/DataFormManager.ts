/* eslint-disable max-classes-per-file */

import { type Readable, type Writable, get, writable } from 'svelte/store';

import type { Schema } from '@mathesar/models/Schema';
import type { Table } from '@mathesar/models/Table';
import { TableStructure } from '@mathesar/stores/table-data';
import type CacheManager from '@mathesar/utils/CacheManager';

import type { DataFormField } from './DataFormField';
import type {
  DataFormStructure,
  DataFormStructureFactory,
} from './DataFormStructure';

export interface DataFormManager {
  dataFormStructure: DataFormStructure;
}

export class ReadonlyDataFormManager implements DataFormManager {
  dataFormStructure;

  constructor(dfsFactory: DataFormStructureFactory) {
    this.dataFormStructure = dfsFactory();
  }
}

interface SelectedStaticElement {
  type: 'name' | 'description';
}

interface SelectedFieldElement {
  type: 'field';
  field: DataFormField;
}

export type SelectedElement = SelectedStaticElement | SelectedFieldElement;

export class EditableDataFormManager implements DataFormManager {
  readonly dataFormStructure;

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

  readonly deleteDataForm;

  constructor(props: {
    createDataFormStructure: DataFormStructureFactory;
    schema: Schema;
    tableStructureCache: CacheManager<Table['oid'], TableStructure>;
    deleteDataForm: () => Promise<unknown>;
  }) {
    this.dataFormStructure = props.createDataFormStructure((e) => {
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
    this.schema = props.schema;
    this.tableStructureCache = props.tableStructureCache;
    this.deleteDataForm = props.deleteDataForm;
  }

  selectElement(element: SelectedElement) {
    this._selectedElement.set(element);
  }

  resetSelectedElement() {
    this._selectedElement.set(undefined);
  }

  getTableStructure(tableOid: number) {
    const tableStructureProps = {
      oid: tableOid,
      schema: this.schema,
    };

    return this.tableStructureCache.getOrCreate(
      tableStructureProps.oid,
      () => new TableStructure(tableStructureProps),
    );
  }
}

/* eslint-enable max-classes-per-file */
