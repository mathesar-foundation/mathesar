import type { TableStructureSubstance } from '@mathesar/stores/table-data/TableStructure';
import { getGloballyUniqueId } from '@mathesar-component-library';

import type { FieldColumn } from './FieldColumn';
import { FkField } from './FkField';
import { FormFields } from './FormFields';
import { ScalarField } from './ScalarField';
import type { EdfNestedFieldChanges } from './types';

export type DataFormField = ScalarField | FkField;
export type ParentDataFormField = FkField; // May contain more types in the future eg., ReverseFkField

export type DataFormFieldFactory = (
  holder: FormFields,
  onChange: (e: EdfNestedFieldChanges) => unknown,
) => DataFormField;

function factoryFromFieldColumn(
  fieldColumn: FieldColumn,
  index: number,
  tableStructureSubstance: TableStructureSubstance,
): DataFormFieldFactory {
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

    return (holder, onChange) =>
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
        onChange,
      );
  }
  return (holder, onChange) =>
    new ScalarField(
      holder,
      {
        ...baseProps,
        kind: 'scalar_column',
      },
      onChange,
    );
}

export default {
  factoryFromFieldColumn,
};
