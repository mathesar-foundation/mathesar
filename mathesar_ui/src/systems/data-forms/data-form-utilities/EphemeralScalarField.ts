import { _ } from 'svelte-i18n';

import type { RawScalarDataFormField } from '@mathesar/api/rpc/forms';

import { AbstractEphermeralColumnBasedField } from './AbstractEphmeralColumnBasedField';
import type { FormFields } from './FormFields';
import type {
  EdfBaseFieldProps,
  EdfScalarFieldPropChange,
  EphemeralScalarFieldProps,
} from './types';

export class EphermeralScalarField extends AbstractEphermeralColumnBasedField {
  readonly kind: RawScalarDataFormField['kind'] = 'scalar_column';

  private onChange: (e: EdfScalarFieldPropChange) => unknown;

  constructor(
    holder: FormFields,
    props: EphemeralScalarFieldProps,
    onChange: (e: EdfScalarFieldPropChange) => unknown,
  ) {
    super(holder, props);
    this.onChange = onChange;
  }

  protected bubblePropChange(prop: EdfBaseFieldProps) {
    this.onChange({
      target: this,
      prop,
    });
  }

  toRawEphemeralField(): RawScalarDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'scalar_column',
    };
  }
}
