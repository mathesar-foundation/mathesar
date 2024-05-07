import { type Readable, derived, get, writable } from 'svelte/store';

import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import {
  unite,
  withSideChannelSubscriptions,
} from '@mathesar-component-library';

import {
  type FieldStore,
  type RequiredField,
  type ValuedField,
  comboErrorsKey,
  disabledKey,
} from './field';
import {
  type ComboValidator,
  type Filled,
  isValid as outcomeIsValid,
} from './validators';

type GenericFieldsObj = Record<string, FieldStore>;
type Values<FieldsObj extends GenericFieldsObj> = {
  [K in keyof FieldsObj]: FieldsObj[K] extends FieldStore<infer T> ? T : never;
};

function runComboValidators(
  valuedFields: ValuedField[],
  comboValidators: ComboValidator[],
): void {
  const fieldErrorMap = new Map<FieldStore, string[]>();
  comboValidators.forEach((validator) => {
    const { outcome, fields } = validator(valuedFields);
    fields.forEach((field) => {
      const errors = fieldErrorMap.get(field) ?? [];
      const newErrors = outcomeIsValid(outcome) ? [] : [outcome.errorMsg];
      fieldErrorMap.set(field, [...errors, ...newErrors]);
    });
  });
  for (const [field, newErrors] of fieldErrorMap) {
    const errors = get(field[comboErrorsKey]);
    if (JSON.stringify(errors) !== JSON.stringify(newErrors)) {
      field[comboErrorsKey].set(newErrors);
    }
  }
}

export function makeForm<FieldsObj extends GenericFieldsObj>(
  fields: FieldsObj,
  comboValidators: ComboValidator[] = [],
) {
  const valuedFields: Readable<ValuedField[]> = unite(
    Object.entries(fields).map(([name, field]) =>
      derived(field, (value) => ({ name, field, value })),
    ),
  );
  const values = derived(valuedFields, ($valuedFields) => {
    runComboValidators($valuedFields, comboValidators);
    return Object.fromEntries(
      $valuedFields.map(({ name, value }) => [name, value]),
    ) as Values<FieldsObj>;
  });

  const requestStatus = writable<RequestStatus | undefined>(undefined);

  const isSubmitting = derived(
    requestStatus,
    (status) => status?.state === 'processing',
  );

  const isValid = derived(
    unite(Object.values(fields).map((f) => f.isValid)),
    (a) => a.every((i) => i),
  );
  const canSubmit = derived(
    unite(Object.values(fields).map((f) => f.canSubmit)),
    (a) => a.every((i) => i),
  );
  const hasChanges = derived(
    unite(Object.values(fields).map((f) => f.hasChanges)),
    (a) => a.some((i) => i),
  );

  function clearServerErrors() {
    requestStatus.update((v) => (v?.state === 'failure' ? undefined : v));
    Object.values(fields).forEach((field) => {
      field.serverErrors.set([]);
    });
  }

  function reset() {
    clearServerErrors();
    Object.values(fields).forEach((field) => {
      field.reset();
    });
  }

  const store = derived(
    [values, isValid, canSubmit, hasChanges],
    ([$values, $isValid, $canSubmit, $hasChanges]) => ({
      values: $values,
      isValid: $isValid,
      canSubmit: $canSubmit,
      hasChanges: $hasChanges,
    }),
  );

  /**
   * Why do we need this "side channel subscription thing"?
   *
   * When `requestStatus` changes, we want to update the `disabled` state of all
   * fields. The call to `requestStatus.subscribe` handles this reactivity. We
   * wrap that code in this side-channel-subscription mechanism so as to
   * properly handle the _unsubscriptions_ and avoid memory leaks. When the last
   * subscriber unsubscribes from the form store, then the `requestStatus`
   * subscription will be unsubscribed as well. This approach ties the
   * reactivity of the `disabled` fields to the `requestStatus` store, while
   * tieing the lifetime of that reactivity to the lifetime of the form store.
   * We can't perform the reactive updates within a store derived directly from
   * `requestStatus`, because the reactive updates would fail to execute if the
   * derived store had no subscribers. The approach here works because we're
   * certain enough that the form store will have at least one subscriber.
   */
  const storeWithSideChannelSubscriptions = withSideChannelSubscriptions(
    store,
    [
      () =>
        requestStatus.subscribe((status) => {
          Object.values(fields).forEach((field) => {
            field[disabledKey].set(status?.state === 'processing');
          });
        }),
    ],
  );

  return {
    ...storeWithSideChannelSubscriptions,
    fields,
    reset,
    clearServerErrors,
    requestStatus,
    isSubmitting,
  };
}

export type Form<FieldsObj extends GenericFieldsObj = GenericFieldsObj> =
  ReturnType<typeof makeForm<FieldsObj>>;

type GetFieldsObj<F> = F extends Form<infer FieldsObj> ? FieldsObj : never;

type FilledFieldValue<F> = F extends RequiredField<infer T>
  ? Filled<T>
  : F extends FieldStore<infer T>
    ? T
    : never;

type FilledFieldValues<FieldsObj extends GenericFieldsObj> = {
  [K in keyof FieldsObj]: FilledFieldValue<FieldsObj[K]>;
};

export type FilledFormValues<F> = FilledFieldValues<GetFieldsObj<F>>;
