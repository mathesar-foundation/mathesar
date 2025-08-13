import type { RawScalarDataFormField } from '@mathesar/api/rpc/forms';

import type { DataFormStructureChangeEventHandler } from '../DataFormStructureChangeEventHandler';

import {
  AbstractColumnBasedField,
  type AbstractColumnBasedFieldModifiableProps,
  type AbstractColumnBasedFieldProps,
} from './AbstractColumnBasedField';
import type { FormFields } from './FormFields';

interface ScalarFieldProps extends AbstractColumnBasedFieldProps {
  kind: RawScalarDataFormField['kind'];
}

export type ScalarFieldPropChangeEvent = {
  type: 'scalar-field/prop';
  target: ScalarField;
  prop: AbstractColumnBasedFieldModifiableProps;
};

export class ScalarField extends AbstractColumnBasedField {
  readonly kind: RawScalarDataFormField['kind'] = 'scalar_column';

  private changeEventHandler: DataFormStructureChangeEventHandler;

  constructor(
    container: FormFields,
    props: ScalarFieldProps,
    changeEventHandler: DataFormStructureChangeEventHandler,
  ) {
    super(container, props);
    this.changeEventHandler = changeEventHandler;
  }

  protected triggerChangeEvent(prop: ScalarFieldPropChangeEvent['prop']) {
    this.changeEventHandler.trigger({
      type: 'scalar-field/prop',
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
