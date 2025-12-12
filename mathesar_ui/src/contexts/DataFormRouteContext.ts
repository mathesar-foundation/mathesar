import { api } from '@mathesar/api/rpc';
import type { RawDataForm } from '@mathesar/api/rpc/forms';
import type { DataForm } from '@mathesar/models/DataForm';
import AsyncStore from '@mathesar/stores/AsyncStore';

import type { SchemaRouteContext } from './SchemaRouteContext';
import { getRouteContext, setRouteContext } from './utils';

const contextKey = Symbol('dataform route store');

function getCombinedAsyncStore() {
  return new AsyncStore((_rawDataForm: RawDataForm) =>
    api.forms
      .get_source_info({ form_token: _rawDataForm.token })
      .run()
      .transformResolved((rawFormSource) => ({
        rawDataForm: _rawDataForm,
        rawFormSource,
      })),
  );
}

export class DataFormRouteContext {
  schemaRouteContext;

  dataForm;

  rawDataFormWithSource;

  constructor(schemaRouteContext: SchemaRouteContext, dataForm: DataForm) {
    this.schemaRouteContext = schemaRouteContext;
    this.dataForm = dataForm;
    this.rawDataFormWithSource = getCombinedAsyncStore();
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
