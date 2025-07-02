import type {
  RawDataFormGetResponse,
  RawEphemeralDataFormField,
} from '@mathesar/api/rpc/forms';
import { ProcessedColumn } from '@mathesar/stores/table-data';
import type { TableStructureSubstance } from '@mathesar/stores/table-data/TableStructure';
import { getGloballyUniqueId } from '@mathesar-component-library';

import type { ParentEphemeralField } from './AbstractEphemeralField';
import { EphermeralFkField } from './EphemeralFkField';
import { EphemeralReverseFkField } from './EphemeralReverseFkField';
import { EphermeralScalarField } from './EphemeralScalarField';

export function columnToEphemeralField(
  pc: ProcessedColumn,
  tableStructureSubstance: TableStructureSubstance,
  parentField: ParentEphemeralField,
  index: number,
) {
  const baseProps = {
    key: getGloballyUniqueId(),
    label: pc.column.name,
    help: null,
    placeholder: null,
    index,
    isRequired: false,
    styling: {},
  };
  if (pc.linkFk) {
    const fkConstraintOid = pc.linkFk.oid;
    const referentTableOid = pc.linkFk.referent_table_oid;
    const referenceTableName = tableStructureSubstance.linksInTable.find(
      (lnk) => lnk.table.oid === referentTableOid,
    )?.table.name;
    return new EphermeralFkField(parentField, {
      ...baseProps,
      label: referenceTableName ?? baseProps.label,
      processedColumn: pc,
      rule: 'only_select',
      fkConstraintOid,
      relatedTableOid: referentTableOid,
    });
  }
  return new EphermeralScalarField(parentField, {
    ...baseProps,
    processedColumn: pc,
  });
}

function getColumnDetailFromFormSource(
  formSource: RawDataFormGetResponse['field_col_info_map'],
  tableOid: number,
  columnAttnum: number,
) {
  const tableContainer = formSource.tables[tableOid];
  if (!tableContainer) {
    throw new Error(
      `Form source does not include table information for oid: ${tableOid}`,
    );
  }

  const columnInfo = tableContainer.columns[columnAttnum];
  if (!columnInfo) {
    throw new Error(
      `Form source does not include column information for table: ${tableOid}, column attnum: ${columnAttnum}`,
    );
  }

  return columnInfo;
}

function getConstraintDetailFromFormSource(
  formSource: RawDataFormGetResponse['field_col_info_map'],
  constraintOid: number,
) {
  const constraintInfo = formSource.constraints[constraintOid];

  if (!constraintInfo) {
    throw new Error(
      `Form source does not include constraint information oid: ${constraintOid}`,
    );
  }

  return constraintInfo;
}

export function rawEphemeralFieldToEphemeralField(
  rawEphemeralField: RawEphemeralDataFormField,
  parentField: ParentEphemeralField | null,
  baseTableOid: number,
  formSource: RawDataFormGetResponse['field_col_info_map'],
) {
  const baseProps = {
    key: rawEphemeralField.key,
    label: rawEphemeralField.label,
    help: rawEphemeralField.help,
    placeholder: null,
    index: rawEphemeralField.index,
    isRequired: rawEphemeralField.is_required,
    styling: rawEphemeralField.styling,
  };

  const parentTableOid =
    parentField === null ? baseTableOid : parentField.relatedTableOid;

  if (rawEphemeralField.kind === 'scalar_column') {
    const columnDetails = getColumnDetailFromFormSource(
      formSource,
      parentTableOid,
      rawEphemeralField.column_attnum,
    );

    return new EphermeralScalarField(parentField, {
      ...baseProps,
      processedColumn: new ProcessedColumn({
        tableOid: parentTableOid,
        column: columnDetails,
        columnIndex: 0,
        constraints: [],
      }),
    });
  }

  if (rawEphemeralField.kind === 'foreign_key') {
    const columnDetails = getColumnDetailFromFormSource(
      formSource,
      parentTableOid,
      rawEphemeralField.column_attnum,
    );

    const constraintDetails = getConstraintDetailFromFormSource(
      formSource,
      rawEphemeralField.constraint_oid,
    );

    const fkField = new EphermeralFkField(parentField, {
      ...baseProps,
      processedColumn: new ProcessedColumn({
        tableOid: parentTableOid,
        column: columnDetails,
        columnIndex: 0,
        constraints: [constraintDetails],
      }),
      rule: 'select_or_create',
      fkConstraintOid: constraintDetails.oid,
      relatedTableOid: rawEphemeralField.related_table_oid,
    });

    const nestedFields = rawEphemeralField.child_fields?.map((field) =>
      rawEphemeralFieldToEphemeralField(
        field,
        fkField,
        baseTableOid,
        formSource,
      ),
    ) ?? [];
    fkField.setNestedFields(nestedFields);

    return fkField;
  }

  const constraintDetails = getConstraintDetailFromFormSource(
    formSource,
    rawEphemeralField.constraint_oid,
  );

  const revFkField = new EphemeralReverseFkField(parentField, {
    ...baseProps,
    reverseFkConstraintOid: constraintDetails.oid,
    relatedTableOid: rawEphemeralField.related_table_oid,
    nestedFields: []
  });

  const nestedFields = rawEphemeralField.child_fields?.map((field) =>
    rawEphemeralFieldToEphemeralField(
      field,
      revFkField,
      baseTableOid,
      formSource,
    ),
  ) ?? [];
  revFkField.setNestedFields(nestedFields);

  return revFkField;
}
