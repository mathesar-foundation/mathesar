/* eslint-disable max-classes-per-file */

import { type Readable, type Writable, get, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { Schema } from '@mathesar/models/Schema';
import type { Table } from '@mathesar/models/Table';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
import { TableStructure } from '@mathesar/stores/table-data';
import type CacheManager from '@mathesar/utils/CacheManager';

import { getDefaultFormName } from '../../utils';

import type {
  DataFormStructure,
  DataFormStructureFactory,
} from './DataFormStructure';
import { DataFormStructureChangeEventHandler } from './DataFormStructureChangeEventHandler';
import type { DataFormField } from './fields';

export interface DataFormManager {
  dataFormStructure: DataFormStructure;
}

export class DataFormFillOutManager implements DataFormManager {
  token: Readable<string>;

  dataFormStructure;

  private _isSuccessfullySubmitted = writable(false);

  get isSuccessfullySubmitted(): Readable<boolean> {
    return this._isSuccessfullySubmitted;
  }

  constructor(props: {
    buildDataFormStructure: DataFormStructureFactory;
    token: Readable<string>;
  }) {
    this.token = props.token;
    this.dataFormStructure = props.buildDataFormStructure({
      rowSeekerRecordStoreConstructor: (fieldDetails) => () =>
        new AsyncRpcApiStore(api.forms.list_related_records, {
          staticProps: {
            form_token: get(this.token),
            field_key: fieldDetails.key,
          },
        }),
    });
  }

  submitAnother() {
    this._isSuccessfullySubmitted.set(false);
  }

  async submit() {
    await api.forms
      .submit({
        form_token: get(this.token),
        values: this.dataFormStructure.getFormSubmitRequest(),
      })
      .run();
    this._isSuccessfullySubmitted.set(true);
  }
}

interface SelectableStaticElement {
  type: 'name' | 'description';
}

interface SelectableFieldElement {
  type: 'field';
  field: DataFormField;
}

export type SelectableElement =
  | SelectableStaticElement
  | SelectableFieldElement;

// TODO_FORMS: Rename this class to DataFormBuildManager
export class EditableDataFormManager implements DataFormManager {
  readonly dataFormStructure;

  private _selectedElement: Writable<SelectableElement | undefined> =
    writable();

  get selectedElement(): Readable<SelectableElement | undefined> {
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
    buildDataFormStructure: DataFormStructureFactory;
    schema: Schema;
    tableStructureCache: CacheManager<Table['oid'], TableStructure>;
    deleteDataForm: () => Promise<unknown>;
  }) {
    this.dataFormStructure = props.buildDataFormStructure({
      changeEventHandler: new DataFormStructureChangeEventHandler({
        fieldAdded: (field) => this.selectField(field),
        fieldDeleted: (field) => {
          if (this.isFieldSelected(field)) {
            this.selectParentOfSelectedElement();
          }
        },
        allChanges: () => this._hasChanges.set(true),
      }),
      rowSeekerRecordStoreConstructor: (fieldDetails) => () =>
        new AsyncRpcApiStore(api.records.list_summaries, {
          staticProps: {
            database_id: this.schema.database.id,
            table_oid: fieldDetails.relatedTableOid,
          },
        }),
    });
    this.schema = props.schema;
    this.tableStructureCache = props.tableStructureCache;
    this.deleteDataForm = props.deleteDataForm;
  }

  selectElement(element: SelectableElement) {
    this._selectedElement.set(element);
  }

  private selectField(field: DataFormField) {
    this.selectElement({
      type: 'field',
      field,
    });
  }

  private isFieldSelected(field: DataFormField) {
    const currentSelectedElement = get(this.selectedElement);
    return (
      currentSelectedElement?.type === 'field' &&
      currentSelectedElement.field === field
    );
  }

  private selectParentOfSelectedElement() {
    const currentSelectedElement = get(this.selectedElement);
    if (currentSelectedElement?.type === 'field') {
      const { parent } = currentSelectedElement.field.container;
      if ('kind' in parent) {
        this.selectElement({
          type: 'field',
          field: parent,
        });
        return;
      }
    }
    this.resetSelectedElement();
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

  async checkAndSetDefaultFormName() {
    if (get(this.dataFormStructure.name).trim() === '') {
      const tableStructure = this.getTableStructure(
        this.dataFormStructure.baseTableOid,
      );
      const result = await tableStructure.getSubstanceOnceResolved();
      // Checking again since name could have changed manually
      if (
        result.resolvedValue &&
        get(this.dataFormStructure.name).trim() === ''
      ) {
        this.dataFormStructure.setName(
          getDefaultFormName(result.resolvedValue.table),
        );
      }
    }
  }
}

/* eslint-enable max-classes-per-file */
