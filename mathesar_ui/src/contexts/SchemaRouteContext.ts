import type { Schema } from '@mathesar/models/Schema';

import { getRouteContext, setRouteContext } from './utils';

const contextKey = Symbol('schema route store');

export class SchemaRouteContext {
  schema;

  dataForms;

  constructor(schema: Schema) {
    this.schema = schema;
    this.dataForms = schema.constructDataFormsStore();
  }

  static construct(schema: Schema) {
    return setRouteContext(contextKey, new SchemaRouteContext(schema));
  }

  static get() {
    return getRouteContext<SchemaRouteContext>(contextKey);
  }
}
