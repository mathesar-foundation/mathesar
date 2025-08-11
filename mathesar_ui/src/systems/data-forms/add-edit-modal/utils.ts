import {
  type RawDataFormField,
  type RawEphemeralDataForm,
  dataFormStructureVersion,
} from '@mathesar/api/rpc/forms';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import type { TableStructureSubstance } from '@mathesar/stores/table-data/TableStructure';
import { getGloballyUniqueId } from '@mathesar-component-library';

function columnToRawDataFormField(
  pc: ProcessedColumn,
  tableStructureSubstance: TableStructureSubstance,
  index: number,
): RawDataFormField {
  const baseProps = {
    key: getGloballyUniqueId(),
    label: pc.column.name,
    help: null,
    index,
    is_required: false,
    column_attnum: pc.column.id,
    styling: {},
  };
  if (pc.linkFk) {
    const referentTableOid = pc.linkFk.referent_table_oid;
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

export function tableStructureSubstanceToRawEphemeralForm(
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
    fields: [...tableStructureSubstance.processedColumns.values()]
      .filter((pc) => !pc.column.default?.is_dynamic)
      .map((c, index) =>
        columnToRawDataFormField(c, tableStructureSubstance, index),
      ),
  };
}
