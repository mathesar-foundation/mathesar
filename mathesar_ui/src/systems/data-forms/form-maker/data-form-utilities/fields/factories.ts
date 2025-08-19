import type {
  RawDataFormField,
  RawForeignKeyDataFormField,
  RawScalarDataFormField,
} from '@mathesar/api/rpc/forms';
import type { TableStructureSubstance } from '@mathesar/stores/table-data/TableStructure';
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
import { FieldColumn } from './FieldColumn';
import { FkField } from './FkField';
import { FormFields } from './FormFields';
import { ScalarField } from './ScalarField';

export type DataFormField = ScalarField | FkField;
export type ParentDataFormField = FkField; // May contain more types in the future eg., ReverseFkField

export type DataFormFieldFactory = (
  container: FormFields,
  structureCtx: DataFormStructureCtx,
) => DataFormField;

export function buildDataFormFieldFactory(props: {
  fieldColumn: FieldColumn;
  index: number;
  tableStructureSubstance: TableStructureSubstance;
}): DataFormFieldFactory {
  const { fieldColumn, index, tableStructureSubstance } = props;

  const baseProps = {
    fieldColumn,
    key: getGloballyUniqueId(),
    label: fieldColumn.column.name,
    help: null,
    placeholder: null,
    index,
    isRequired: false,
    columnAttnum: fieldColumn.column.id,
    styling: {},
  };

  if (fieldColumn.foreignKeyLink) {
    const referentTableOid = fieldColumn.foreignKeyLink.relatedTableOid;
    const referenceTableName = tableStructureSubstance.linksInTable.find(
      (lnk) => lnk.table.oid === referentTableOid,
    )?.table.name;

    return (holder, structureCtx) =>
      new FkField(
        holder,
        {
          ...baseProps,
          kind: 'foreign_key',
          label: referenceTableName ?? baseProps.label,
          relatedTableOid: referentTableOid,
          interactionRule: 'must_pick',
          createFields: (parent, onContainerChange) =>
            new FormFields(parent, [], onContainerChange),
        },
        structureCtx,
      );
  }
  return (holder, structureCtx) =>
    new ScalarField(
      holder,
      {
        ...baseProps,
        kind: 'scalar_column',
      },
      structureCtx,
    );
}

function getBaseFieldsPropsFromRawDataFormField(props: {
  parentTableOid: number;
  rawField: RawDataFormField;
  formSource: FormSource;
}): AbstractColumnBasedFieldProps {
  const { rawField, parentTableOid } = props;

  const baseProps = {
    key: rawField.key,
    label: rawField.label,
    help: rawField.help,
    placeholder: null,
    index: rawField.index,
    isRequired: rawField.is_required,
    styling: rawField.styling,
  };

  const columnDetails = props.formSource.getColumnInfo(
    parentTableOid,
    rawField.column_attnum,
  );

  return {
    ...baseProps,
    fieldColumn: new FieldColumn({
      tableOid: parentTableOid,
      column: columnDetails,
      foreignKeyLink:
        'related_table_oid' in rawField &&
        isDefinedNonNullable(rawField.related_table_oid)
          ? {
              relatedTableOid: rawField.related_table_oid,
            }
          : null,
    }),
  };
}

export function buildFkFieldFactory(props: {
  parentTableOid: number;
  rawField: RawForeignKeyDataFormField;
  formSource: FormSource;
}) {
  const { rawField } = props;
  const baseProps = getBaseFieldsPropsFromRawDataFormField(props);

  return (holder: FormFields, structureCtx: DataFormStructureCtx) =>
    new FkField(
      holder,
      {
        ...baseProps,
        kind: rawField.kind,
        relatedTableOid: rawField.related_table_oid,
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        createFields: buildFormFieldContainerFactory({
          parentTableOid: rawField.related_table_oid,
          rawDataFormFields: rawField.child_fields ?? [],
          formSource: props.formSource,
        }),
        interactionRule: rawField.fk_interaction_rule,
      },
      structureCtx,
    );
}

export function buildScalarFieldFactory(props: {
  parentTableOid: number;
  rawField: RawScalarDataFormField;
  formSource: FormSource;
}) {
  const { rawField } = props;
  const baseProps = getBaseFieldsPropsFromRawDataFormField(props);

  return (container: FormFields, structureCtx: DataFormStructureCtx) =>
    new ScalarField(
      container,
      {
        ...baseProps,
        kind: rawField.kind,
      },
      structureCtx,
    );
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
      props.rawDataFormFields.map((f) => {
        if (f.kind === 'scalar_column') {
          return buildScalarFieldFactory({
            parentTableOid: props.parentTableOid,
            rawField: f,
            formSource: props.formSource,
          });
        }
        return buildFkFieldFactory({
          parentTableOid: props.parentTableOid,
          rawField: f,
          formSource: props.formSource,
        });
      }),
      structureCtx,
    );
}
