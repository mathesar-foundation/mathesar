/* eslint-disable max-classes-per-file */

import {
  type Readable,
  type Writable,
  derived,
  get,
  readable,
  writable,
} from 'svelte/store';

import type { RawForeignKeyDataFormField } from '@mathesar/api/rpc/forms';
import {
  type FieldStore,
  optionalField,
  requiredField,
} from '@mathesar/components/form';

export type DataFormFieldInputValueHolder =
  | DataFormFieldScalarInputValueHolder
  | DataFormFieldFkInputValueHolder;

export class DataFormFieldScalarInputValueHolder {
  readonly isRequired;

  readonly key: string;

  readonly inputFieldStore: Readable<FieldStore>;

  readonly includeFieldStoreInForm: Readable<boolean>;

  constructor(key: string, isRequired: Readable<boolean>) {
    this.key = key;
    this.isRequired = isRequired;
    this.inputFieldStore = derived(this.isRequired, ($isRequired) =>
      $isRequired ? requiredField(undefined) : optionalField(undefined),
    );
    this.includeFieldStoreInForm = readable(true);
  }
}

export class DataFormFieldFkInputValueHolder extends DataFormFieldScalarInputValueHolder {
  private _userAction: Writable<'pick' | 'create'>;

  private fkInteractionRule;

  readonly inputFieldStore: Readable<FieldStore>;

  readonly includeFieldStoreInForm;

  constructor(
    key: string,
    isRequired: Readable<boolean>,
    fkInteractionRule: Readable<
      RawForeignKeyDataFormField['fk_interaction_rule']
    >,
  ) {
    super(key, isRequired);
    this.fkInteractionRule = fkInteractionRule;
    const rule = get(this.fkInteractionRule);
    this._userAction = writable(rule === 'must_create' ? 'create' : 'pick');
    this.includeFieldStoreInForm = derived(
      this.userAction,
      ($userAction) => $userAction === 'pick',
    );
    this.inputFieldStore = derived(
      [this.isRequired, this.userAction],
      ([$isRequired, $userAction]) =>
        $isRequired && $userAction === 'pick'
          ? requiredField(undefined)
          : optionalField(undefined),
    );
  }

  get userAction(): Readable<'pick' | 'create'> {
    return derived(
      [this.fkInteractionRule, this._userAction],
      ([$rule, $action]) => {
        if ($rule === 'must_pick') {
          return 'pick';
        }
        if ($rule === 'must_create') {
          return 'create';
        }
        return $action;
      },
    );
  }

  setUserAction(action: 'pick' | 'create') {
    this._userAction.set(action);
    if (action === 'create') {
      get(this.inputFieldStore).reset();
    }
  }
}

/* eslint-enable max-classes-per-file */
