import { type Readable, derived } from 'svelte/store';

import type { RawEphemeralDataForm } from '@mathesar/api/rpc/forms';
import type { DataForm } from '@mathesar/models/DataForm';
import type { Schema } from '@mathesar/models/Schema';
import { ImmutableMap, reactiveSort } from '@mathesar-component-library';

import { getRouteContext, getSafeRouteContext, setRouteContext } from './utils';

const contextKey = Symbol('schema route store');

export class SchemaRouteContext {
  schema;

  dataFormsFetch;

  dataForms: Readable<ImmutableMap<number, DataForm>>;

  constructor(schema: Schema) {
    this.schema = schema;
    this.dataFormsFetch = schema.constructDataFormsStore();

    const unsortedForms = derived(this.dataFormsFetch, (forms) => [
      ...(forms.resolvedValue?.values() ?? []),
    ]);
    const sortedForms = reactiveSort(
      unsortedForms,
      ({ structure }) => structure,
      (a, b) => a.name.localeCompare(b.name),
    );

    this.dataForms = derived(
      sortedForms,
      (forms) => new ImmutableMap(forms.map((form) => [form.id, form])),
    );
  }

  async insertDataForm(dataFormDef: RawEphemeralDataForm) {
    const newDataForm = await this.schema.addDataForm(dataFormDef);
    this.dataFormsFetch.updateResolvedValue((dataForms) =>
      dataForms.with(newDataForm.id, newDataForm),
    );
    return newDataForm;
  }

  async removeDataForm(dataForm: DataForm) {
    await dataForm.delete();
    this.dataFormsFetch.updateResolvedValue((df) => df.without(dataForm.id));
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
