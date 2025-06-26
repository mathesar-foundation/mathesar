/* eslint-disable max-classes-per-file */

import { type Writable, get, writable } from 'svelte/store';

import type {
  RawDataForm,
  RawDataFormBaseField,
  RawForeignKeyDataFormField,
  RawReverseForeignKeyDataFormField,
  RawScalarDataFormField,
} from '@mathesar/api/rpc/data_forms';
import { WritableMap, getGloballyUniqueId } from '@mathesar/component-library';
import { type FieldStore, optionalField } from '@mathesar/components/form';
import type { Table } from '@mathesar/models/Table';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import {
  TableStructure,
  type TableStructureSubstance,
} from '@mathesar/stores/table-data/TableStructure';
import type CacheManager from '@mathesar/utils/CacheManager';

export interface EdfUpdateDiff {
  change: keyof EphemeralDataForm;
}

export interface EphemeralFieldProps {
  table: Table;
  tableStructureCache: CacheManager<Table['oid'], TableStructure>;
  key: RawDataFormBaseField['key'];
  label: RawDataFormBaseField['label'];
  help: RawDataFormBaseField['help'];
  index: RawDataFormBaseField['index'];
}

abstract class EphemeralField {
  readonly table;

  readonly tableStructureCache;

  readonly key;

  readonly path;

  readonly index;

  readonly label;

  readonly help;

  constructor(parentPath: string[], data: EphemeralFieldProps) {
    this.table = data.table;
    this.tableStructureCache = data.tableStructureCache;
    this.key = data.key;
    this.path = [...parentPath, this.key];
    this.index = writable(data.index);
    this.label = writable(data.label);
    this.help = writable(data.help);
  }

  static fromColumn(
    tableStructureSubstance: TableStructureSubstance,
    pc: ProcessedColumn,
    parentPath: string[],
    index: number,
    tableStructureCache: CacheManager<Table['oid'], TableStructure>,
  ) {
    const baseProps = {
      key: getGloballyUniqueId(),
      label: pc.column.name,
      help: null,
      placeholder: null,
      index,
      table: tableStructureSubstance.table,
    };
    if (pc.linkFk) {
      const referentTableOid = pc.linkFk.referent_table_oid;
      const referenceTableName = tableStructureSubstance.linksInTable.find(
        (lnk) => lnk.table.oid === referentTableOid,
      )?.table.name;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return new EphermeralFkField(parentPath, {
        ...baseProps,
        label: referenceTableName ?? baseProps.label,
        processedColumn: pc,
        rule: 'only_select',
        linkedTableStructure: tableStructureCache.get(
          referentTableOid,
          () =>
            new TableStructure({
              schema: tableStructureSubstance.table.schema,
              oid: referentTableOid,
            }),
        ),
        tableStructureCache,
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new EphermeralScalarField(parentPath, {
      ...baseProps,
      processedColumn: pc,
      tableStructureCache,
    });
  }
}

export class EphermeralScalarField extends EphemeralField {
  readonly kind: RawScalarDataFormField['kind'] = 'scalar_column';

  readonly processedColumn;

  readonly fieldStore: FieldStore;

  constructor(
    parentPath: string[],
    data: EphemeralFieldProps & { processedColumn: ProcessedColumn },
  ) {
    super(parentPath, data);
    this.processedColumn = data.processedColumn;
    this.fieldStore = optionalField(null);
  }
}

export const fkFieldInteractionRules = [
  'only_select',
  'select_or_create',
  'must_create',
] as const;

export type FkFieldInteractionRule = (typeof fkFieldInteractionRules)[number];

export class EphermeralFkField extends EphemeralField {
  readonly kind: RawForeignKeyDataFormField['kind'] = 'foreign_key';

  readonly processedColumn;

  readonly linkedTableStructure: TableStructure;

  readonly fieldStore: FieldStore;

  readonly rule: Writable<FkFieldInteractionRule>;

  readonly nestedFields: WritableMap<string, EphemeralDataFormField>;

  constructor(
    parentPath: string[],
    data: EphemeralFieldProps & {
      processedColumn: ProcessedColumn;
      rule: FkFieldInteractionRule;
      nestedFields?: WritableMap<
        EphemeralDataFormField['key'],
        EphemeralDataFormField
      >;
      linkedTableStructure: TableStructure;
    },
  ) {
    super(parentPath, data);
    this.processedColumn = data.processedColumn;
    const fkLink = this.processedColumn.linkFk;
    if (!fkLink) {
      throw Error('The passed column is not a foreign key');
    }
    this.rule = writable(data.rule);
    this.nestedFields = data.nestedFields ?? new WritableMap();
    this.fieldStore = optionalField(null);
    this.linkedTableStructure = data.linkedTableStructure;
  }

  async setInteractionRule(rule: FkFieldInteractionRule) {
    this.rule.set(rule);
    const res = await this.linkedTableStructure.asyncStore.tick();
    if (get(this.nestedFields).size === 0) {
      const tableStructureSubstance = res.resolvedValue;
      if (tableStructureSubstance) {
        this.nestedFields.reconstruct(
          [...tableStructureSubstance.processedColumns.values()]
            .filter((pc) => !pc.column.default?.is_dynamic)
            .map((c, index) => {
              const ef = EphemeralField.fromColumn(
                tableStructureSubstance,
                c,
                [],
                index,
                this.tableStructureCache,
              );
              return [ef.key, ef];
            }),
        );
      }
    }
  }
}

export class EphemeralReverseFkField extends EphemeralField {
  readonly kind: RawReverseForeignKeyDataFormField['kind'] =
    'reverse_foreign_key';

  readonly nestedFields: Map<
    EphemeralDataFormField['key'],
    EphemeralDataFormField
  > = new Map();
}

export type EphemeralDataFormField =
  | EphermeralScalarField
  | EphermeralFkField
  | EphemeralReverseFkField;

export class EphemeralDataForm {
  readonly baseTable;

  readonly name;

  readonly description;

  readonly associated_role;

  readonly fields;

  constructor(edf: {
    baseTable: Table;
    name: Writable<RawDataForm['name']>;
    description: Writable<RawDataForm['description']>;
    associated_role: Writable<RawDataForm['associated_role']>;
    fields: WritableMap<EphemeralDataFormField['key'], EphemeralDataFormField>;
  }) {
    this.baseTable = edf.baseTable;
    this.name = edf.name;
    this.description = edf.description;
    this.associated_role = edf.associated_role;
    this.fields = edf.fields;
  }

  setName(name: string): EdfUpdateDiff {
    this.name.set(name);
    return {
      change: 'name',
    };
  }

  static fromTable(
    tableStructureSubstance: TableStructureSubstance,
    tableStructureCache: CacheManager<Table['oid'], TableStructure>,
  ) {
    return new EphemeralDataForm({
      baseTable: tableStructureSubstance.table,
      name: writable(tableStructureSubstance.table.name),
      description: writable(null),
      associated_role: writable(null),
      fields: new WritableMap(
        [...tableStructureSubstance.processedColumns.values()]
          .filter((pc) => !pc.column.default?.is_dynamic)
          .map((c, index) => {
            const ef = EphemeralField.fromColumn(
              tableStructureSubstance,
              c,
              [],
              index,
              tableStructureCache,
            );
            return [ef.key, ef];
          }),
      ),
    });
  }
}

/* eslint-enable max-classes-per-file */
