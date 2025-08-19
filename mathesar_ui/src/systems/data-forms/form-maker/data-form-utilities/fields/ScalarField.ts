import { derived } from 'svelte/store';

import type { RawScalarDataFormField } from '@mathesar/api/rpc/forms';
import { getDbTypeBasedInputCap } from '@mathesar/components/cell-fabric/utils';

import type { DataFormStructureCtx } from '../DataFormStructure';

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

  readonly inputComponentAndProps: AbstractColumnBasedField['inputComponentAndProps'];

  constructor(
    container: FormFields,
    props: ScalarFieldProps,
    structureCtx: DataFormStructureCtx,
  ) {
    super(container, props, structureCtx);
    this.inputComponentAndProps = derived(this.styling, (styling) => {
      let { cellInfo } = this.fieldColumn.abstractType;
      if (cellInfo.type === 'string') {
        cellInfo = {
          type: 'string',
          config: { multiLine: styling?.size === 'large' },
        };
      }
      return getDbTypeBasedInputCap(this.fieldColumn.column, cellInfo);
    });
  }

  protected triggerChangeEvent(prop: ScalarFieldPropChangeEvent['prop']) {
    this.structureCtx.changeEventHandler?.trigger({
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
