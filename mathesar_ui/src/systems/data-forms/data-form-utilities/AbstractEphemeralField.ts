import { type Readable, type Updater, get, writable } from 'svelte/store';

import type {
  RawDataFormBaseField,
  RawEphemeralDataFormField,
} from '@mathesar/api/rpc/forms';

import type { EphermeralFkField } from './EphemeralFkField';
import type { EphermeralScalarField } from './EphemeralScalarField';

export type EphemeralDataFormField = EphermeralScalarField | EphermeralFkField;

export type ParentEphemeralField = EphermeralFkField | null;

export interface EphemeralFieldProps {
  key: RawDataFormBaseField['key'];
  label: RawDataFormBaseField['label'];
  help: RawDataFormBaseField['help'];
  index: RawDataFormBaseField['index'];
  isRequired: RawDataFormBaseField['is_required'];
  styling: RawDataFormBaseField['styling'];
}

export abstract class AbstractEphemeralField {
  readonly parentField;

  readonly key;

  private _index;

  get index(): Readable<EphemeralFieldProps['index']> {
    return this._index;
  }

  private _label;

  get label(): Readable<EphemeralFieldProps['label']> {
    return this._label;
  }

  private _help;

  get help(): Readable<EphemeralFieldProps['help']> {
    return this._help;
  }

  private _isRequired;

  get isRequired(): Readable<EphemeralFieldProps['isRequired']> {
    return this._isRequired;
  }

  private _styling;

  get styling(): Readable<EphemeralFieldProps['styling']> {
    return this._styling;
  }

  constructor(parentField: ParentEphemeralField, data: EphemeralFieldProps) {
    this.key = data.key;
    this.parentField = parentField;
    this._index = writable(data.index);
    this._label = writable(data.label);
    this._help = writable(data.help);
    this._isRequired = writable(data.isRequired);
    this._styling = writable(data.styling);
  }

  setLabel(label: string) {
    this._label.set(label);
  }

  setHelpText(help: string | null) {
    this._help.set(help);
  }

  updateIndex(updator: Updater<number>) {
    this._index.update(updator);
  }

  setIsRequired(isRequired: boolean) {
    this._isRequired.set(isRequired);
  }

  updateStyling(styling: Partial<EphemeralFieldProps['styling']>) {
    this._styling.update((s) => {
      if (styling === null) {
        return styling;
      }
      return {
        ...(s || {}),
        ...styling,
      };
    });
  }

  abstract isConceptuallyEqual(dataFormField: EphemeralDataFormField): boolean;

  abstract toRawEphemeralField(): RawEphemeralDataFormField;

  protected getBaseFieldRawJson() {
    return {
      key: this.key,
      index: get(this.index),
      label: get(this.label),
      help: get(this.help),
      styling: {},
      is_required: get(this.isRequired),
    };
  }
}
