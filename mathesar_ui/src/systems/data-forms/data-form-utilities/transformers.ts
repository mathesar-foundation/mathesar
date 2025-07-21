import type {
  RawDataFormSource,
  RawEphemeralDataFormField,
} from '@mathesar/api/rpc/forms';
import type { TableStructureSubstance } from '@mathesar/stores/table-data/TableStructure';
import { getGloballyUniqueId } from '@mathesar-component-library';

import type {
  EphemeralDataFormField,
  ParentEphemeralField,
} from './AbstractEphemeralField';
import { EphermeralFkField } from './EphemeralFkField';
import { EphermeralScalarField } from './EphemeralScalarField';
import { FieldColumn } from './FieldColumn';

export function fieldColumnToEphemeralField(
  fc: FieldColumn,
  tableStructureSubstance: TableStructureSubstance,
  parentField: ParentEphemeralField,
  index: number,
): EphermeralFkField | EphermeralScalarField {
  const baseProps = {
    key: getGloballyUniqueId(),
    label: fc.column.name,
    help: null,
    placeholder: null,
    index,
    isRequired: false,
    styling: {},
  };
  if (fc.foreignKeyLink) {
    const referentTableOid = fc.foreignKeyLink.relatedTableOid;
    const referenceTableName = tableStructureSubstance.linksInTable.find(
      (lnk) => lnk.table.oid === referentTableOid,
    )?.table.name;
    return new EphermeralFkField(parentField, {
      ...baseProps,
      label: referenceTableName ?? baseProps.label,
      fieldColumn: fc,
      interactionRule: 'must_pick',
      relatedTableOid: referentTableOid,
    });
  }
  return new EphermeralScalarField(parentField, {
    ...baseProps,
    fieldColumn: fc,
  });
}

export function tableStructureSubstanceToEphemeralFields(
  tableStructureSubstance: TableStructureSubstance,
  parentField: ParentEphemeralField | null,
): (EphermeralFkField | EphermeralScalarField)[] {
  return [...tableStructureSubstance.processedColumns.values()]
    .filter((pc) => !pc.column.default?.is_dynamic)
    .map((c, index) => {
      const ef = fieldColumnToEphemeralField(
        FieldColumn.fromProcessedColumn(c),
        tableStructureSubstance,
        parentField,
        index,
      );
      return ef;
    });
}

function getColumnDetailFromFormSource(
  formSource: RawDataFormSource,
  tableOid: number,
  columnAttnum: number,
) {
  // TODO_FORMS: Do not let these errors break UI.

  const tableContainer = formSource[tableOid];
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

export function rawEphemeralFieldToEphemeralField(
  rawEphemeralField: RawEphemeralDataFormField,
  parentField: ParentEphemeralField | null,
  baseTableOid: number,
  formSource: RawDataFormSource,
): EphemeralDataFormField {
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
      fieldColumn: new FieldColumn({
        tableOid: parentTableOid,
        column: columnDetails,
      }),
    });
  }

  const columnDetails = getColumnDetailFromFormSource(
    formSource,
    parentTableOid,
    rawEphemeralField.column_attnum,
  );

  const fkField = new EphermeralFkField(parentField, {
    ...baseProps,
    fieldColumn: new FieldColumn({
      tableOid: parentTableOid,
      column: columnDetails,
      foreignKeyLink: {
        relatedTableOid: rawEphemeralField.related_table_oid,
      },
    }),
    interactionRule: rawEphemeralField.fk_interaction_rule,
    relatedTableOid: rawEphemeralField.related_table_oid,
  });

  const nestedFields =
    rawEphemeralField.child_fields?.map((field) =>
      rawEphemeralFieldToEphemeralField(
        field,
        fkField,
        baseTableOid,
        formSource,
      ),
    ) ?? [];
  fkField.nestedFields.reconstruct(nestedFields);

  return fkField;
}
