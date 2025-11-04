import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { RawDataFormField } from '@mathesar/api/rpc/forms';
import {
  ClientSideError,
  type GeneralizedError,
} from '@mathesar/components/errors/errorUtils';

import type { DataFormStructureCtx } from '../DataFormStructure';

import { AbstractField, type AbstractFieldProps } from './AbstractField';
import type { FormFields } from './FormFields';

export const dataFormErrorCodes = {
  COLUMN_NOT_FOUND: -31025,
  COLUMN_USER_LAST_EDITED_BY: -31026,
};

export const dataFormErrors = {
  columnNotFoundError: (props: { tableOid: number; columnAttnum: number }) =>
    new ClientSideError({
      message: get(_)('form_field_column_not_found'),
      code: dataFormErrorCodes.COLUMN_NOT_FOUND,
      data: props,
    }),
  columnUserLastEditedByError: (props: {
    tableOid: number;
    columnAttnum: number;
  }) =>
    new ClientSideError({
      message: get(_)('form_field_column_user_last_edited_by'),
      code: dataFormErrorCodes.COLUMN_USER_LAST_EDITED_BY,
      data: props,
    }),
};

interface ErrorFieldProps extends AbstractFieldProps {
  originalField: RawDataFormField;
  error: GeneralizedError;
}

export class ErrorField extends AbstractField {
  readonly kind = 'error' as const;

  readonly originalField: RawDataFormField;

  readonly error: ClientSideError;

  constructor(
    container: FormFields,
    props: ErrorFieldProps,
    structureCtx: DataFormStructureCtx,
  ) {
    super(container, props, structureCtx);
    this.error = ClientSideError.fromAnything(props.error);
    this.originalField = props.originalField;
  }

  protected triggerChangeEvent() {}

  checkAndSetDefaultLabel() {
    this.setLabel(this.originalField.label ?? '');
  }

  toRawEphemeralField(): RawDataFormField {
    return this.originalField;
  }
}
