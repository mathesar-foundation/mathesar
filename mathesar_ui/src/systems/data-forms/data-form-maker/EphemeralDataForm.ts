/* eslint-disable max-classes-per-file */

import { type Writable, get, writable } from 'svelte/store';

import type {
  RawDataForm,
  RawDataFormBaseField,
  RawEphemeralDataForm,
  RawEphemeralDataFormField,
  RawEphemeralForeignKeyDataFormField,
  RawEphemeralReverseForeignKeyDataFormField,
  RawEphemeralScalarDataFormField,
  RawForeignKeyDataFormField,
  RawReverseForeignKeyDataFormField,
  RawScalarDataFormField,
} from '@mathesar/api/rpc/forms';
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

  abstract toRawEphemeralField(): RawEphemeralDataFormField;

  protected getBaseFieldRawJson() {
    return {
      key: this.key,
      index: get(this.index),
      label: get(this.label),
      help: get(this.help),
      styling: {},
      is_required: false,
    };
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
      const fkConstraintOid = pc.linkFk.oid;
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
        fkConstraintOid,
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

  toRawEphemeralField(): RawEphemeralScalarDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'scalar_column',
      column_attnum: this.processedColumn.id,
    };
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

  readonly fkConstraintOid;

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
      fkConstraintOid: number;
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
    this.fkConstraintOid = data.fkConstraintOid;
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

  toRawEphemeralField(): RawEphemeralForeignKeyDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'foreign_key',
      column_attnum: this.processedColumn.id,
      constraint_oid: this.fkConstraintOid,
      related_table_oid: this.linkedTableStructure.oid,
      child_fields: [...get(this.nestedFields).values()].map((nested_field) =>
        nested_field.toRawEphemeralField(),
      ),
    };
  }
}

export class EphemeralReverseFkField extends EphemeralField {
  readonly kind: RawReverseForeignKeyDataFormField['kind'] =
    'reverse_foreign_key';

  readonly reverseFkConstraintOid;

  readonly linkedTableStructure: TableStructure;

  readonly nestedFields: WritableMap<
    EphemeralDataFormField['key'],
    EphemeralDataFormField
  > = new WritableMap();

  constructor(
    parentPath: string[],
    data: EphemeralFieldProps & {
      nestedFields: WritableMap<
        EphemeralDataFormField['key'],
        EphemeralDataFormField
      >;
      reverseFkConstraintOid: number;
      linkedTableStructure: TableStructure;
    },
  ) {
    super(parentPath, data);
    this.nestedFields = data.nestedFields;
    this.reverseFkConstraintOid = data.reverseFkConstraintOid;
    this.linkedTableStructure = data.linkedTableStructure;
  }

  toRawEphemeralField(): RawEphemeralReverseForeignKeyDataFormField {
    return {
      ...this.getBaseFieldRawJson(),
      kind: 'reverse_foreign_key',
      constraint_oid: this.reverseFkConstraintOid,
      related_table_oid: this.linkedTableStructure.oid,
      child_fields: [...get(this.nestedFields).values()].map((nested_field) =>
        nested_field.toRawEphemeralField(),
      ),
    };
  }
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
    associated_role: Writable<RawDataForm['associated_role_id']>;
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

  toRawEphemeralDataForm(): RawEphemeralDataForm {
    return {
      database_id: this.baseTable.schema.database.id,
      base_table_oid: this.baseTable.oid,
      schema_oid: this.baseTable.schema.oid,
      name: get(this.name),
      description: get(this.description),
      version: 1,
      associated_role_id: get(this.associated_role),
      header_title: {
        text: get(this.name),
      },
      header_subtitle: {
        text: get(this.description) ?? '',
      },
      fields: [...get(this.fields).values()].map((field) =>
        field.toRawEphemeralField(),
      ),
    };
  }
}

/* eslint-enable max-classes-per-file */
