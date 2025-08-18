import type { RawDataFormField } from '@mathesar/api/rpc/forms';

import type { DataFormStructureCtx } from '../DataFormStructure';

import { AbstractField, type AbstractFieldProps } from './AbstractField';
import type { FormFields } from './FormFields';

interface ErrorFieldProps extends AbstractFieldProps {
  originalField: RawDataFormField;
  message: string;
  code: number;
}

export class ErrorField extends AbstractField {
  readonly kind = 'error' as const;

  readonly originalField: RawDataFormField;

  readonly message: string;

  constructor(
    container: FormFields,
    props: ErrorFieldProps,
    structureCtx: DataFormStructureCtx,
  ) {
    super(container, props, structureCtx);
    this.message = props.message;
    this.originalField = props.originalField;
  }

  protected triggerChangeEvent() {}

  toRawEphemeralField(): RawDataFormField {
    return this.originalField;
  }
}
