/* eslint-disable max-classes-per-file */

import { type Readable, derived, get, writable } from 'svelte/store';

import {
  type FieldStore,
  optionalField,
  requiredField,
} from '@mathesar/components/form';

export class DataFormFieldInputValueHolder {
  private readonly isRequired;

  readonly key: string;

  readonly inputFieldStore: Readable<FieldStore>;

  constructor(key: string, isRequired: Readable<boolean>) {
    this.key = key;
    this.isRequired = isRequired;
    this.inputFieldStore = derived(this.isRequired, ($isRequired) =>
      $isRequired ? requiredField(undefined) : optionalField(undefined),
    );
  }
}

export class DataFormFieldFkInputValueHolder extends DataFormFieldInputValueHolder {
  private _userAction = writable<'pick' | 'create'>('pick');

  get userAction(): Readable<'pick' | 'create'> {
    return this._userAction;
  }

  setUserAction(action: 'pick' | 'create') {
    this._userAction.set(action);
    if (action === 'create') {
      get(this.inputFieldStore).reset();
    }
  }
}

/* eslint-enable max-classes-per-file */
