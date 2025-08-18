import type {
  RawDataFormField,
  RawForeignKeyDataFormField,
  RawScalarDataFormField,
} from '@mathesar/api/rpc/forms';
import {
  getGloballyUniqueId,
  isDefinedNonNullable,
} from '@mathesar-component-library';

import type {
  DataFormStructure,
  DataFormStructureCtx,
} from '../DataFormStructure';
import type { FormSource } from '../FormSource';

import type { AbstractColumnBasedFieldProps } from './AbstractColumnBasedField';
import { ErrorField } from './ErrorField';
import { FieldColumn } from './FieldColumn';
import { FkField } from './FkField';
import { FormFields } from './FormFields';
import { ScalarField } from './ScalarField';

export type DataFormField = ScalarField | FkField | ErrorField;
export type ColumnBasedDataFormField = ScalarField | FkField;
export type ParentDataFormField = FkField; // May contain more types in the future eg., ReverseFkField

export type DataFormFieldFactory = (
  container: FormFields,
  structureCtx: DataFormStructureCtx,
) => DataFormField;

function makeErrorFieldFactory({
  message,
  code,
  originalField,
}: {
  originalField: RawDataFormField;
  message: string;
  code: number;
}): DataFormFieldFactory {
  return (holder, structureCtx) =>
    new ErrorField(
      holder,
      {
        key: originalField.key,
        label: originalField.label ?? 'Error',
        help: originalField.help,
        index: originalField.index,
        styling: originalField.styling,
        message,
        code,
        originalField,
      },
      structureCtx,
    );
}

function columnToRawField({
  fieldColumn,
  index,
}: {
  fieldColumn: FieldColumn;
  index: number;
}): RawDataFormField {
  const base = {
    key: getGloballyUniqueId(),
    label: fieldColumn.column.name,
    help: null,
    index,
    is_required: !fieldColumn.column.nullable,
    styling: {},
    column_attnum: fieldColumn.column.id,
  };
  if (isDefinedNonNullable(fieldColumn.foreignKeyLink)) {
    return {
      ...base,
      kind: 'foreign_key',
      related_table_oid: fieldColumn.foreignKeyLink.relatedTableOid,
      fk_interaction_rule: 'must_pick',
      child_fields: [],
    };
  }
  return {
    ...base,
    kind: 'scalar_column',
  };
}

function toResolvedBaseProps({
  rawField,
  fieldColumn,
}: {
  rawField: RawDataFormField;
  fieldColumn: FieldColumn;
}): AbstractColumnBasedFieldProps {
  if (rawField.column_attnum !== fieldColumn.column.id) {
    throw new Error('Incorrect fieldColumn passed. This should never happen.');
  }
  return {
    key: rawField.key,
    label: rawField.label,
    help: rawField.help,
    index: rawField.index,
    isRequired: rawField.is_required,
    styling: rawField.styling,
    fieldColumn,
  };
}

type FieldKind = RawDataFormField['kind'];

type FromResolvedRawArgsMap = {
  scalar_column: {
    rawField: RawScalarDataFormField;
    fieldColumn: FieldColumn;
  };
  foreign_key: {
    rawField: RawForeignKeyDataFormField;
    fieldColumn: FieldColumn;
    createChildFields: DataFormFieldContainerFactory;
  };
};

type FieldFactoryImpl<K extends FieldKind> = (
  args: FromResolvedRawArgsMap[K],
) => DataFormFieldFactory;

const FIELD_FACTORY_REGISTRY: {
  [K in FieldKind]: FieldFactoryImpl<K>;
} = {
  scalar_column: ({
    rawField,
    fieldColumn,
  }: FromResolvedRawArgsMap['scalar_column']) => {
    const base = toResolvedBaseProps({ rawField, fieldColumn });
    return (container, structureCtx) =>
      new ScalarField(
        container,
        {
          ...base,
          kind: 'scalar_column',
        },
        structureCtx,
      );
  },

  foreign_key: ({
    rawField,
    fieldColumn,
    createChildFields,
  }: FromResolvedRawArgsMap['foreign_key']) => {
    const base = toResolvedBaseProps({ rawField, fieldColumn });
    if (
      rawField.related_table_oid !== fieldColumn.foreignKeyLink?.relatedTableOid
    ) {
      throw new Error(
        'Incorrect fk config in fieldColumn. This should never happen.',
      );
    }

    return (holder, structureCtx) =>
      new FkField(
        holder,
        {
          ...base,
          kind: 'foreign_key',
          relatedTableOid: rawField.related_table_oid,
          interactionRule: rawField.fk_interaction_rule,
          createFields: createChildFields,
        },
        structureCtx,
      );
  },
};

export function buildFieldFactoryFromRaw({
  parentTableOid,
  rawField,
  formSource,
}: {
  parentTableOid: number;
  rawField: RawDataFormField;
  formSource: FormSource;
}): DataFormFieldFactory {
  try {
    const columnDetails = formSource.getColumnInfo(
      parentTableOid,
      rawField.column_attnum,
    );

    if (!columnDetails) {
      throw new Error('Column details not present');
    }

    const foreignKeyLink =
      'related_table_oid' in rawField &&
      isDefinedNonNullable(rawField.related_table_oid)
        ? {
            relatedTableOid: rawField.related_table_oid,
          }
        : null;

    const fieldColumn = new FieldColumn({
      tableOid: parentTableOid,
      column: columnDetails,
      foreignKeyLink,
    });

    const { kind } = rawField;

    if (kind === 'scalar_column') {
      return FIELD_FACTORY_REGISTRY.scalar_column({
        rawField,
        fieldColumn,
      });
    }

    return FIELD_FACTORY_REGISTRY.foreign_key({
      rawField,
      fieldColumn,
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      createChildFields: buildFormFieldContainerFactory({
        parentTableOid: rawField.related_table_oid,
        rawDataFormFields: rawField.child_fields ?? [],
        formSource,
      }),
    });
  } catch (err) {
    return makeErrorFieldFactory({
      originalField: rawField,
      message: 'TODO',
      code: 123,
    });
  }
}

export function buildFieldFactoryFromColumn({
  fieldColumn,
  index,
}: {
  fieldColumn: FieldColumn;
  index: number;
}): DataFormFieldFactory {
  const rawField = columnToRawField({ fieldColumn, index });
  try {
    const { kind } = rawField;

    if (kind === 'scalar_column') {
      return FIELD_FACTORY_REGISTRY.scalar_column({
        rawField,
        fieldColumn,
      });
    }

    return FIELD_FACTORY_REGISTRY.foreign_key({
      rawField,
      fieldColumn,
      createChildFields: (container, structureCtx) =>
        new FormFields(container, [], structureCtx),
    });
  } catch (err) {
    return makeErrorFieldFactory({
      originalField: rawField,
      message: 'TODO',
      code: 123,
    });
  }
}

export type DataFormFieldContainerFactory = (
  parent: DataFormStructure | ParentDataFormField,
  structureCtx: DataFormStructureCtx,
) => FormFields;

export function buildFormFieldContainerFactory(props: {
  parentTableOid: number;
  rawDataFormFields: RawDataFormField[];
  formSource: FormSource;
}): DataFormFieldContainerFactory {
  return (
    parent: DataFormStructure | ParentDataFormField,
    structureCtx: DataFormStructureCtx,
  ) =>
    new FormFields(
      parent,
      props.rawDataFormFields.map((rawField) =>
        buildFieldFactoryFromRaw({
          parentTableOid: props.parentTableOid,
          rawField,
          formSource: props.formSource,
        }),
      ),
      structureCtx,
    );
}
