import { _ } from 'svelte-i18n';

import type { RawScalarDataFormField } from '@mathesar/api/rpc/forms';

import {
  AbstractColumnBasedField,
  type AbstractColumnBasedFieldProps,
} from './AbstractColumnBasedField';
import type { FormFields } from './FormFields';
import type { FormSource } from './FormSource';
import type { EdfBaseFieldProps, EdfScalarFieldPropChange } from './types';

interface ScalarFieldProps extends AbstractColumnBasedFieldProps {
  kind: RawScalarDataFormField['kind'];
}

export type ScalarFieldOnChange = (e: EdfScalarFieldPropChange) => unknown;

export class ScalarField extends AbstractColumnBasedField {
  readonly kind: RawScalarDataFormField['kind'] = 'scalar_column';

  private onChange: ScalarFieldOnChange;

  constructor(
    holder: FormFields,
    props: ScalarFieldProps,
    onChange: ScalarFieldOnChange,
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

  static factoryFromRawInfo(
    props: {
      parentTableOid: number;
      rawField: RawScalarDataFormField;
    },
    formSource: FormSource,
  ) {
    const { rawField } = props;
    const baseProps = super.getBasePropsFromRawDataFormField(props, formSource);

    return (holder: FormFields, onChange: ScalarFieldOnChange) =>
      new ScalarField(
        holder,
        {
          ...baseProps,
          kind: rawField.kind,
        },
        onChange,
      );
  }
}
