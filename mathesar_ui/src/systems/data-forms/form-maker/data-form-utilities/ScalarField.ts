import { _ } from 'svelte-i18n';

import type { RawScalarDataFormField } from '@mathesar/api/rpc/forms';

import {
  AbstractColumnBasedField,
  type AbstractColumnBasedFieldProps,
} from './AbstractColumnBasedField';
import type { FormFields } from './FormFields';
import type { EdfBaseFieldProps, EdfScalarFieldPropChange } from './types';

export interface ScalarFieldProps extends AbstractColumnBasedFieldProps {
  kind: RawScalarDataFormField['kind'];
}

export class ScalarField extends AbstractColumnBasedField {
  readonly kind: RawScalarDataFormField['kind'] = 'scalar_column';

  private onChange: (e: EdfScalarFieldPropChange) => unknown;

  constructor(
    holder: FormFields,
    props: ScalarFieldProps,
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
