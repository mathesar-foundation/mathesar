import { type Readable, derived, get as getStoreValue } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { ColumnMetadata } from '@mathesar/api/rpc/_common/columnDisplayOptions';
import type {
  ColumnCreationSpec,
  ColumnPatchSpec,
  ColumnTypeOptions,
  RawColumnWithMetadata,
} from '@mathesar/api/rpc/columns';
import type {
  ConstraintRecipe,
  RawConstraint,
} from '@mathesar/api/rpc/constraints';
import {
  type TableLink,
  getLinksInThisTable,
  getLinksToThisTable,
} from '@mathesar/api/rpc/tables';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { Schema } from '@mathesar/models/Schema';
import { Table } from '@mathesar/models/Table';
import {
  type RpcError,
  batchRun,
} from '@mathesar/packages/json-rpc-client-builder';
import AsyncStore, { type AsyncStoreValue } from '@mathesar/stores/AsyncStore';
import { orderProcessedColumns } from '@mathesar/utils/tables';
import { WritableSet, isDefinedNonNullable } from '@mathesar-component-library';

import {
  ProcessedColumn,
  type ProcessedColumns,
  type ProcessedColumnsStore,
} from './processedColumns';
import type { TableStructureChangeEventHandler } from './TableStructureChangeEventHandler';

export interface TableStructureProps {
  schema: Schema;
  oid: Table['oid'];
  hiddenColumns?: Iterable<number>;
  hasEnhancedPrimaryKeyCell?: boolean;
  changeEventHandler?: TableStructureChangeEventHandler;
}

export interface TableStructureSubstance {
  table: Table;
  processedColumns: ProcessedColumns;
  constraints: RawConstraint[];
  linksInTable: TableLink[];
  linksToTable: TableLink[];
}

function getTableStructureAsyncStore(
  tableProps: TableStructureProps,
  hasEnhancedPrimaryKeyCell: boolean,
) {
  const databaseId = tableProps.schema.database.id;
  const tableOid = tableProps.oid;
  const apiRequest = { database_id: databaseId, table_oid: tableOid };
  return new AsyncStore<void, TableStructureSubstance, RpcError>(() =>
    batchRun([
      api.tables.get_with_metadata(apiRequest),
      api.columns.list_with_metadata(apiRequest),
      api.constraints.list(apiRequest),
      api.tables.list_joinable({
        ...apiRequest,
        max_depth: 2,
      }),
    ]).transformResolved(
      ([
        rawTableWithMetadata,
        columns,
        constraints,
        joinableTableResult,
      ]): TableStructureSubstance => {
        const processedColumns: ProcessedColumns = orderProcessedColumns(
          new Map(
            columns.map((c, index) => [
              String(c.id),
              new ProcessedColumn({
                tableOid,
                column: c,
                columnIndex: index,
                constraints,
                hasEnhancedPrimaryKeyCell,
              }),
            ]),
          ),
          { metadata: rawTableWithMetadata.metadata },
        );

        return {
          table: new Table({ schema: tableProps.schema, rawTableWithMetadata }),
          processedColumns,
          constraints,
          linksInTable: Array.from(
            getLinksInThisTable(
              joinableTableResult,
              new Map(columns.map((c) => [c.id, c])),
            ),
          ),
          linksToTable: Array.from(getLinksToThisTable(joinableTableResult)),
        };
      },
    ),
  );
}

export class TableStructure {
  oid: DBObjectEntry['id'];

  schema: Schema;

  processedColumns: ProcessedColumnsStore;

  table: Readable<Table | undefined>;

  constraints: Readable<RawConstraint[]>;

  linksInTable: Readable<TableLink[]>;

  linksToTable: Readable<TableLink[]>;

  isLoading: Readable<boolean>;

  errors: Readable<RpcError[]>;

  hiddenColumns: WritableSet<number>;

  hasEnhancedPrimaryKeyCell: boolean;

  private changeEventHandler?: TableStructureChangeEventHandler;

  private asyncStore: ReturnType<typeof getTableStructureAsyncStore>;

  pkColumn: Readable<RawColumnWithMetadata | undefined>;

  uniqueColumns: Readable<Set<number>>;

  constructor(props: TableStructureProps) {
    this.oid = props.oid;
    this.schema = props.schema;
    this.hiddenColumns = new WritableSet(props.hiddenColumns);
    this.hasEnhancedPrimaryKeyCell = props.hasEnhancedPrimaryKeyCell ?? true;
    this.changeEventHandler = props.changeEventHandler;
    this.asyncStore = getTableStructureAsyncStore(
      props,
      this.hasEnhancedPrimaryKeyCell,
    );
    void this.asyncStore.run();

    const allProcessedColumns = derived(
      this.asyncStore,
      (tableStructureStoreValue) =>
        tableStructureStoreValue.resolvedValue?.processedColumns ??
        (new Map() as ProcessedColumns),
    );

    this.processedColumns = derived(
      [allProcessedColumns, this.hiddenColumns],
      ([columns, hidden]) => {
        const filtered = new Map<string, ProcessedColumn>();
        for (const [id, column] of columns.entries()) {
          if (!hidden.has(Number(id))) {
            filtered.set(id, column);
          }
        }
        return filtered;
      },
    );

    this.pkColumn = derived(allProcessedColumns, (columns) => {
      for (const column of columns.values()) {
        if (column.column.primary_key) {
          return column.column;
        }
      }
      return undefined;
    });

    this.isLoading = derived(
      this.asyncStore,
      (tableStructureStoreValue) => tableStructureStoreValue.isLoading,
    );
    this.table = derived(
      this.asyncStore,
      (tableStructureStoreValue) =>
        tableStructureStoreValue.resolvedValue?.table,
    );
    this.constraints = derived(
      this.asyncStore,
      (tableStructureStoreValue) =>
        tableStructureStoreValue.resolvedValue?.constraints ?? [],
    );
    this.uniqueColumns = derived(
      this.constraints,
      (constraints) =>
        new Set(
          constraints
            .filter((c) => c.type === 'unique' && c.columns.length === 1)
            .map((c) => c.columns[0]),
        ),
    );
    this.linksInTable = derived(
      this.asyncStore,
      (tableStructureStoreValue) =>
        tableStructureStoreValue.resolvedValue?.linksInTable ?? [],
    );
    this.linksToTable = derived(
      this.asyncStore,
      (tableStructureStoreValue) =>
        tableStructureStoreValue.resolvedValue?.linksToTable ?? [],
    );
    this.errors = derived(this.asyncStore, (tableStructureStoreValue) =>
      tableStructureStoreValue.error ? [tableStructureStoreValue.error] : [],
    );
  }

  async refetch() {
    const result = await this.asyncStore.run();
    return result;
  }

  async getSubstanceOnceResolved(): Promise<
    AsyncStoreValue<TableStructureSubstance, RpcError>
  > {
    const result = await this.asyncStore.getValueOnceResolved();
    return result;
  }

  columns = {
    add: async (columnDetails: ColumnCreationSpec): Promise<void> => {
      const apiRequest = {
        database_id: this.schema.database.id,
        table_oid: this.oid,
      };
      await api.columns
        .add({ ...apiRequest, column_data_list: [columnDetails] })
        .run();
      await this.refetch();
      this.changeEventHandler?.trigger({ type: 'column/added' });
    },

    addWithMetadata: async (
      columnDetails: ColumnCreationSpec,
      metadata: ColumnMetadata | null,
    ): Promise<void> => {
      const apiRequest = {
        database_id: this.schema.database.id,
        table_oid: this.oid,
      };
      const result = await api.columns
        .add({ ...apiRequest, column_data_list: [columnDetails] })
        .run();
      const [columnId] = result;
      if (columnId && isDefinedNonNullable(metadata)) {
        await api.columns.metadata
          .set({
            ...apiRequest,
            column_meta_data_list: [{ attnum: columnId, ...metadata }],
          })
          .run();
      }
      await this.refetch();
      this.changeEventHandler?.trigger({ type: 'column/added' });
    },

    rename: async (
      id: RawColumnWithMetadata['id'],
      name: string,
    ): Promise<void> => {
      const apiRequest = {
        database_id: this.schema.database.id,
        table_oid: this.oid,
      };
      await api.columns
        .patch({ ...apiRequest, column_data_list: [{ id, name }] })
        .run();
      await this.refetch();
      this.changeEventHandler?.trigger({ type: 'column/renamed' });
    },

    updateDescription: async (
      id: RawColumnWithMetadata['id'],
      description: string | null,
    ): Promise<void> => {
      const apiRequest = {
        database_id: this.schema.database.id,
        table_oid: this.oid,
      };
      await api.columns
        .patch({ ...apiRequest, column_data_list: [{ id, description }] })
        .run();
      await this.refetch();
    },

    setNullability: async (
      column: RawColumnWithMetadata,
      nullable: boolean,
    ): Promise<void> => {
      if (column.primary_key) {
        throw new Error(
          `Column "${column.name}" cannot allow NULL because it is a primary key.`,
        );
      }
      const apiRequest = {
        database_id: this.schema.database.id,
        table_oid: this.oid,
      };
      await api.columns
        .patch({
          ...apiRequest,
          column_data_list: [{ id: column.id, nullable }],
        })
        .run();
      await this.refetch();
      this.changeEventHandler?.trigger({ type: 'column/patched' });
    },

    patch: async (patchSpec: ColumnPatchSpec): Promise<void> => {
      const apiRequest = {
        database_id: this.schema.database.id,
        table_oid: this.oid,
      };
      await api.columns
        .patch({ ...apiRequest, column_data_list: [patchSpec] })
        .run();
      await this.refetch();
      this.changeEventHandler?.trigger({ type: 'column/patched' });
    },

    setDisplayOptions: async (
      changes: Map<number, ColumnMetadata | null>,
    ): Promise<void> => {
      if (!changes.size) return;
      const apiRequest = {
        database_id: this.schema.database.id,
        table_oid: this.oid,
      };
      function* getApiRequests() {
        for (const [columnId, displayOptions] of changes.entries()) {
          yield api.columns.metadata.set({
            ...apiRequest,
            column_meta_data_list: [{ attnum: columnId, ...displayOptions }],
          });
        }
      }
      await batchRun([...getApiRequests()]);
      await this.refetch();
    },

    changeType: async (spec: {
      id: RawColumnWithMetadata['id'];
      type: ColumnCreationSpec['type'];
      type_options: ColumnTypeOptions | null;
      metadata: ColumnMetadata | null;
    }): Promise<void> => {
      const apiRequest = {
        database_id: this.schema.database.id,
        table_oid: this.oid,
      };
      await api.columns
        .patch({
          ...apiRequest,
          column_data_list: [
            { id: spec.id, type: spec.type, type_options: spec.type_options },
          ],
        })
        .run();
      if (isDefinedNonNullable(spec.metadata)) {
        await api.columns.metadata
          .set({
            ...apiRequest,
            column_meta_data_list: [{ attnum: spec.id, ...spec.metadata }],
          })
          .run();
      }
      await this.refetch();
      this.changeEventHandler?.trigger({ type: 'column/patched' });
    },

    delete: async (columnId: RawColumnWithMetadata['id']): Promise<void> => {
      const apiRequest = {
        database_id: this.schema.database.id,
        table_oid: this.oid,
      };
      await api.columns
        .delete({ ...apiRequest, column_attnums: [columnId] })
        .run();
      await this.refetch();
      this.changeEventHandler?.trigger({ type: 'column/deleted', columnId });
    },
  };

  constraintsMethods = {
    add: async (recipe: ConstraintRecipe): Promise<void> => {
      const apiRequest = {
        database_id: this.schema.database.id,
        table_oid: this.oid,
      };
      await api.constraints
        .add({ ...apiRequest, constraint_def_list: [recipe] })
        .run();
      await this.refetch();
      this.changeEventHandler?.trigger({ type: 'constraint/added' });
    },

    remove: async (constraintId: number): Promise<void> => {
      const apiRequest = {
        database_id: this.schema.database.id,
        table_oid: this.oid,
      };
      await api.constraints
        .delete({ ...apiRequest, constraint_oid: constraintId })
        .run();
      await this.refetch();
      this.changeEventHandler?.trigger({ type: 'constraint/removed' });
    },

    setColumnUniqueness: async (
      column: RawColumnWithMetadata,
      shouldBeUnique: boolean,
    ): Promise<void> => {
      if (column.primary_key) {
        if (!shouldBeUnique) {
          throw new Error(
            `Column "${column.name}" must remain unique because it is a primary key.`,
          );
        }
        return;
      }

      const currentConstraints = getStoreValue(this.constraints);
      const currentlyIsUnique = currentConstraints
        .filter((c) => c.type === 'unique' && c.columns.length === 1)
        .some((c) => c.columns[0] === column.id);

      if (shouldBeUnique === currentlyIsUnique) {
        return;
      }

      if (shouldBeUnique) {
        await this.constraintsMethods.add({ type: 'u', columns: [column.id] });
        return;
      }

      const uniqueConstraintsForColumn = currentConstraints.filter(
        (c) =>
          c.type === 'unique' &&
          c.columns.length === 1 &&
          c.columns[0] === column.id,
      );
      await Promise.all(
        uniqueConstraintsForColumn.map((c) =>
          api.constraints
            .delete({
              database_id: this.schema.database.id,
              table_oid: this.oid,
              constraint_oid: c.oid,
            })
            .run(),
        ),
      );
      await this.refetch();
      this.changeEventHandler?.trigger({ type: 'constraint/removed' });
    },
  };
}
