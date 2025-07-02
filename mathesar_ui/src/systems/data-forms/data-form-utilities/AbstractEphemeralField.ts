import { get, writable } from 'svelte/store';

import type {
  RawDataFormBaseField,
  RawEphemeralDataFormField,
} from '@mathesar/api/rpc/forms';

import type { EphermeralFkField } from './EphemeralFkField';
import type { EphemeralReverseFkField } from './EphemeralReverseFkField';
import type { EphermeralScalarField } from './EphemeralScalarField';

export type EphemeralDataFormField =
  | EphermeralScalarField
  | EphermeralFkField
  | EphemeralReverseFkField;

export type ParentEphemeralField =
  | EphermeralFkField
  | EphemeralReverseFkField
  | null;

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

  readonly index;

  readonly label;

  readonly help;

  readonly isRequired;

  constructor(parentField: ParentEphemeralField, data: EphemeralFieldProps) {
    this.key = data.key;
    this.parentField = parentField;
    this.index = writable(data.index);
    this.label = writable(data.label);
    this.help = writable(data.help);
    this.isRequired = writable(data.isRequired);
  }

  abstract toRawEphemeralField(): RawEphemeralDataFormField;

  protected getBaseFieldRawJson() {
    return {
      key: this.key,
      index: get(this.index),
      label: get(this.label),
      help: get(this.help),
      styling: {},
      is_required: false,
    };
  }
}
