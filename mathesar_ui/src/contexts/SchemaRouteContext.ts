import type { RawEphemeralDataForm } from '@mathesar/api/rpc/forms';
import type { DataForm } from '@mathesar/models/DataForm';
import type { Schema } from '@mathesar/models/Schema';

import { getRouteContext, getSafeRouteContext, setRouteContext } from './utils';

const contextKey = Symbol('schema route store');

export class SchemaRouteContext {
  schema;

  dataForms;

  constructor(schema: Schema) {
    this.schema = schema;
    this.dataForms = schema.constructDataFormsStore();
  }

  async insertDataForm(dataFormDef: RawEphemeralDataForm) {
    const newDataForm = await this.schema.addDataForm(dataFormDef);
    this.dataForms.updateResolvedValue((dataForms) =>
      dataForms.with(newDataForm.id, newDataForm),
    );
    return newDataForm;
  }

  async removeDataForm(dataForm: DataForm) {
    await dataForm.delete();
    this.dataForms.updateResolvedValue((df) => df.without(dataForm.id));
  }

  static construct(schema: Schema) {
    return setRouteContext(contextKey, new SchemaRouteContext(schema));
  }

  static get() {
    return getRouteContext<SchemaRouteContext>(contextKey);
  }

  static getSafe() {
    return getSafeRouteContext<SchemaRouteContext>(contextKey);
  }
}
