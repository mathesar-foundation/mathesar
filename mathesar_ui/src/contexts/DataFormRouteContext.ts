import { get } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { RawEphemeralDataForm } from '@mathesar/api/rpc/forms';
import type { DataForm } from '@mathesar/models/DataForm';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';

import type { SchemaRouteContext } from './SchemaRouteContext';
import { getRouteContext, setRouteContext } from './utils';

const contextKey = Symbol('dataform route store');

export class DataFormRouteContext {
  schemaRouteContext;

  dataForm;

  formSourceInfo;

  constructor(schemaRouteContext: SchemaRouteContext, dataForm: DataForm) {
    this.schemaRouteContext = schemaRouteContext;
    this.dataForm = dataForm;
    this.formSourceInfo = new AsyncRpcApiStore(api.forms.get_source_info);
    void this.formSourceInfo.run({ form_token: get(this.dataForm.token) });
  }

  async replaceDataForm(dataFormDef: RawEphemeralDataForm) {
    this.formSourceInfo.reset();
    await this.dataForm.replaceDataForm(dataFormDef);
    void this.formSourceInfo.run({ form_token: get(this.dataForm.token) });
  }

  static construct(schemaRouteContext: SchemaRouteContext, dataForm: DataForm) {
    return setRouteContext(
      contextKey,
      new DataFormRouteContext(schemaRouteContext, dataForm),
    );
  }

  static get() {
    return getRouteContext<DataFormRouteContext>(contextKey);
  }
}
