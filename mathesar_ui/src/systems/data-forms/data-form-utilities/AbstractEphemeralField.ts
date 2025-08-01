import { type Readable, type Updater, get, writable } from 'svelte/store';

import type { RawDataFormField } from '@mathesar/api/rpc/forms';

import type { FormFields } from './FormFields';
import type { AbstractEphemeralFieldProps, EdfBaseFieldProps } from './types';

export abstract class AbstractEphemeralField {
  readonly holder;

  readonly key;

  private _index;

  get index(): Readable<AbstractEphemeralFieldProps['index']> {
    return this._index;
  }

  private _label;

  get label(): Readable<AbstractEphemeralFieldProps['label']> {
    return this._label;
  }

  private _help;

  get help(): Readable<AbstractEphemeralFieldProps['help']> {
    return this._help;
  }

  private _styling;

  get styling(): Readable<AbstractEphemeralFieldProps['styling']> {
    return this._styling;
  }

  constructor(holder: FormFields, props: AbstractEphemeralFieldProps) {
    this.holder = holder;
    this.key = props.key;
    this._index = writable(props.index);
    this._label = writable(props.label);
    this._help = writable(props.help);
    this._styling = writable(props.styling);
  }

  setLabel(label: string) {
    this._label.set(label);
    this.bubblePropChange('label');
  }

  setHelpText(help: string | null) {
    this._help.set(help);
    this.bubblePropChange('help');
  }

  updateIndex(updator: Updater<number>) {
    this._index.update(updator);
    this.bubblePropChange('index');
  }

  updateStyling(styling: Partial<AbstractEphemeralFieldProps['styling']>) {
    this._styling.update((s) => {
      if (styling === null) {
        return styling;
      }
      return {
        ...(s || {}),
        ...styling,
      };
    });
    this.bubblePropChange('styling');
  }

  protected abstract bubblePropChange(e: EdfBaseFieldProps): unknown;

  abstract toRawEphemeralField(): RawDataFormField;

  protected getBaseFieldRawJson() {
    return {
      key: this.key,
      index: get(this.index),
      label: get(this.label),
      help: get(this.help),
      styling: {},
    };
  }

  getFormToken() {
    let form = this.holder.parent;
    while (!('token' in form) && form.holder.parent) {
      form = form.holder.parent;
    }
    if (!('token' in form)) {
      throw new Error(
        'Field is not present within a form. This should never happen.',
      );
    }
    return form.token;
  }
}
