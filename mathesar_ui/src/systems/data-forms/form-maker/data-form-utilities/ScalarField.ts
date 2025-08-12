import { _ } from 'svelte-i18n';

import type { RawScalarDataFormField } from '@mathesar/api/rpc/forms';

import {
  AbstractColumnBasedField,
  type AbstractColumnBasedFieldModifiableProps,
  type AbstractColumnBasedFieldProps,
} from './AbstractColumnBasedField';
import type { DataFormStructureChangeEventHandler } from './DataFormStructureChangeEventHandler';
import type { FormFields } from './FormFields';
import type { FormSource } from './FormSource';

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

  static factoryFromRawInfo(
    props: {
      parentTableOid: number;
      rawField: RawScalarDataFormField;
    },
    formSource: FormSource,
  ) {
    const { rawField } = props;
    const baseProps = super.getBasePropsFromRawDataFormField(props, formSource);

    return (
      container: FormFields,
      changeEventHandler: DataFormStructureChangeEventHandler,
    ) =>
      new ScalarField(
        container,
        {
          ...baseProps,
          kind: rawField.kind,
        },
        changeEventHandler,
      );
  }
}
