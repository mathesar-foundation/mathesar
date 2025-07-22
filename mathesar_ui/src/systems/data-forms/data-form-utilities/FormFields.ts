import { execPipe, some } from 'iter-tools';
import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  derived,
  get,
} from 'svelte/store';

import { WritableSet } from '@mathesar-component-library';

import type { EphemeralDataFormField } from './AbstractEphemeralField';
import type { FieldColumn } from './FieldColumn';

export class FormFields {
  private fieldSet: WritableSet<EphemeralDataFormField>;

  private sortedFields: Readable<EphemeralDataFormField[]>;

  constructor(i: Iterable<EphemeralDataFormField> = []) {
    this.fieldSet = new WritableSet(i);
    this.sortedFields = derived<
      WritableSet<EphemeralDataFormField>,
      EphemeralDataFormField[]
    >(
      this.fieldSet,
      ($fieldSet, set) => {
        let unsubIndexStores: (() => void)[] = [];

        function updateSorted() {
          set(
            [...$fieldSet.values()].sort((a, b) => get(a.index) - get(b.index)),
          );
        }

        function resubscribe() {
          unsubIndexStores.forEach((u) => u());
          unsubIndexStores = [];

          unsubIndexStores = [...$fieldSet.values()].map((item) =>
            item.index.subscribe(updateSorted),
          );
        }

        resubscribe();
        updateSorted();
        return () => unsubIndexStores.forEach((u) => u());
      },
      [],
    );
  }

  subscribe(run: Subscriber<EphemeralDataFormField[]>): Unsubscriber {
    return this.sortedFields.subscribe(run);
  }

  hasField(dataFormField: EphemeralDataFormField) {
    return derived(this.fieldSet, ($fieldSet) =>
      execPipe(
        $fieldSet.values(),
        some((f) => f.isConceptuallyEqual(dataFormField)),
      ),
    );
  }

  hasColumn(fc: FieldColumn) {
    return derived(this.fieldSet, ($fieldSet) =>
      execPipe(
        $fieldSet.values(),
        some((f) => f.hasColumn(fc)),
      ),
    );
  }

  reconstruct(dataFormField: Iterable<EphemeralDataFormField>) {
    this.fieldSet.reconstruct(dataFormField);
  }

  delete(dataFormField: EphemeralDataFormField) {
    const fieldIndex = get(dataFormField.index);
    for (const field of get(this.fieldSet)) {
      if (get(field.index) > fieldIndex) {
        field.updateIndex((index) => index - 1);
      }
    }
    this.fieldSet.delete(dataFormField);
  }

  add(dataFormField: EphemeralDataFormField) {
    if (!get(this.hasField(dataFormField))) {
      const fieldIndex = get(dataFormField.index);
      for (const field of get(this.fieldSet)) {
        if (get(field.index) >= fieldIndex) {
          field.updateIndex((index) => index + 1);
        }
      }
      this.fieldSet.add(dataFormField);
    }
  }
}
