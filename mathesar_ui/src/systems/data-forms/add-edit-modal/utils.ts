import type { RawDataFormField } from '@mathesar/api/rpc/forms';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import { getGloballyUniqueId } from '@mathesar-component-library';

export function processedColumnToRawDataFormField(
  pc: ProcessedColumn,
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
    return {
      ...baseProps,
      kind: 'foreign_key',
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
