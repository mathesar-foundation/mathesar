import {
  type RawDataForm,
  type RawDataFormField,
  type RawDataFormSource,
  type RawEphemeralDataForm,
  dataFormStructureVersion,
} from '@mathesar/api/rpc/forms';
import type { TableStructureSubstance } from '@mathesar/stores/table-data/TableStructure';
import { getGloballyUniqueId } from '@mathesar-component-library';

import { FieldColumn } from './FieldColumn';
import type {
  DataFormStructureProps,
  EphemeralDataFormFieldProps,
} from './types';

export function fieldColumnToEphemeralFieldProps(
  fc: FieldColumn,
  tableStructureSubstance: TableStructureSubstance,
  index: number,
): EphemeralDataFormFieldProps {
  const baseProps = {
    fieldColumn: fc,
    key: getGloballyUniqueId(),
    label: fc.column.name,
    help: null,
    placeholder: null,
    index,
    isRequired: false,
    columnAttnum: fc.column.id,
    styling: {},
  };
  if (fc.foreignKeyLink) {
    const referentTableOid = fc.foreignKeyLink.relatedTableOid;
    const referenceTableName = tableStructureSubstance.linksInTable.find(
      (lnk) => lnk.table.oid === referentTableOid,
    )?.table.name;
    return {
      ...baseProps,
      kind: 'foreign_key',
      label: referenceTableName ?? baseProps.label,
      relatedTableOid: referentTableOid,
      interactionRule: 'must_pick',
      nestedFields: [],
    };
  }
  return {
    ...baseProps,
    kind: 'scalar_column',
  };
}

export function tableStructureSubstanceToEphemeralFieldProps(
  tableStructureSubstance: TableStructureSubstance,
): EphemeralDataFormFieldProps[] {
  return [...tableStructureSubstance.processedColumns.values()]
    .filter((pc) => !pc.column.default?.is_dynamic)
    .map((c, index) => {
      const ef = fieldColumnToEphemeralFieldProps(
        FieldColumn.fromProcessedColumn(c),
        tableStructureSubstance,
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

export function rawEphemeralFieldToEphemeralFieldProps(
  rawEphemeralField: RawDataFormField,
  parentTableOid: number,
  formSource: RawDataFormSource,
): EphemeralDataFormFieldProps {
  const baseProps = {
    key: rawEphemeralField.key,
    label: rawEphemeralField.label,
    help: rawEphemeralField.help,
    placeholder: null,
    index: rawEphemeralField.index,
    isRequired: rawEphemeralField.is_required,
    styling: rawEphemeralField.styling,
  };

  const columnDetails = getColumnDetailFromFormSource(
    formSource,
    parentTableOid,
    rawEphemeralField.column_attnum,
  );

  if (rawEphemeralField.kind === 'scalar_column') {
    return {
      ...baseProps,
      kind: rawEphemeralField.kind,
      fieldColumn: new FieldColumn({
        tableOid: parentTableOid,
        column: columnDetails,
        foreignKeyLink: null,
      }),
    };
  }

  return {
    ...baseProps,
    kind: rawEphemeralField.kind,
    relatedTableOid: rawEphemeralField.related_table_oid,
    fieldColumn: new FieldColumn({
      tableOid: parentTableOid,
      column: columnDetails,
      foreignKeyLink: {
        relatedTableOid: rawEphemeralField.related_table_oid,
      },
    }),
    nestedFields: (rawEphemeralField.child_fields ?? []).map((rf) =>
      rawEphemeralFieldToEphemeralFieldProps(
        rf,
        rawEphemeralField.related_table_oid,
        formSource,
      ),
    ),
    interactionRule: rawEphemeralField.fk_interaction_rule,
  };
}

export function rawDataFormToDataFormStructureProps(
  rawDataForm: RawDataForm,
  formSource: RawDataFormSource,
): DataFormStructureProps {
  return {
    baseTableOid: rawDataForm.base_table_oid,
    schemaOid: rawDataForm.schema_oid,
    databaseId: rawDataForm.database_id,
    token: rawDataForm.token,
    name: rawDataForm.name,
    description: rawDataForm.description,
    headerTitle: rawDataForm.header_title,
    headerSubTitle: rawDataForm.header_subtitle,
    associatedRoleId: rawDataForm.associated_role_id,
    submitMessage: rawDataForm.submit_message,
    submitRedirectUrl: rawDataForm.submit_redirect_url,
    submitButtonLabel: rawDataForm.submit_button_label,
    fields: rawDataForm.fields.map((f) =>
      rawEphemeralFieldToEphemeralFieldProps(
        f,
        rawDataForm.base_table_oid,
        formSource,
      ),
    ),
  };
}

function fieldColumnToRawDataFormField(
  fc: FieldColumn,
  tableStructureSubstance: TableStructureSubstance,
  index: number,
): RawDataFormField {
  const baseProps = {
    key: getGloballyUniqueId(),
    label: fc.column.name,
    help: null,
    index,
    is_required: false,
    column_attnum: fc.column.id,
    styling: {},
  };
  if (fc.foreignKeyLink) {
    const referentTableOid = fc.foreignKeyLink.relatedTableOid;
    const referenceTableName = tableStructureSubstance.linksInTable.find(
      (lnk) => lnk.table.oid === referentTableOid,
    )?.table.name;
    return {
      ...baseProps,
      kind: 'foreign_key',
      label: referenceTableName ?? baseProps.label,
      related_table_oid: referentTableOid,
      fk_interaction_rule: 'must_pick',
      child_fields: [],
    };
  }
  return {
    ...baseProps,
    kind: 'scalar_column',
  };
}

function tableStructureSubstanceToRawEphemeralField(
  tableStructureSubstance: TableStructureSubstance,
): RawDataFormField[] {
  return [...tableStructureSubstance.processedColumns.values()]
    .filter((pc) => !pc.column.default?.is_dynamic)
    .map((c, index) => {
      const ef = fieldColumnToRawDataFormField(
        FieldColumn.fromProcessedColumn(c),
        tableStructureSubstance,
        index,
      );
      return ef;
    });
}

export function tableStructureSubstanceRawEphemeralForm(
  tableStructureSubstance: TableStructureSubstance,
): RawEphemeralDataForm {
  return {
    base_table_oid: tableStructureSubstance.table.oid,
    schema_oid: tableStructureSubstance.table.schema.oid,
    database_id: tableStructureSubstance.table.schema.database.id,
    version: dataFormStructureVersion,
    name: tableStructureSubstance.table.name,
    description: null,
    header_title: {
      text: tableStructureSubstance.table.name,
    },
    header_subtitle: null,
    associated_role_id: null,
    submit_message: null,
    submit_redirect_url: null,
    submit_button_label: null,
    fields: tableStructureSubstanceToRawEphemeralField(tableStructureSubstance),
  };
}
