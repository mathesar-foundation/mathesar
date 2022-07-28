import { getAvailableName } from '@mathesar/utils/db';
import type { TableEntry, JpPath } from '@mathesar/api/tables/tableList';
import type { Column } from '@mathesar/api/tables/columns';
import { isDefinedNonNullable } from '@mathesar-component-library';
import type { UnsavedQueryInstance } from '@mathesar/stores/queries';

export interface QueryInitialColumn {
  id: Column['id'];
  name: Column['name'];
  tableName: TableEntry['name'];
  jpPath?: JpPath;
}

export default class QueryModel implements UnsavedQueryInstance {
  base_table;

  id;

  name;

  initial_columns;

  constructor(model?: UnsavedQueryInstance) {
    this.base_table = model?.base_table;
    this.id = model?.id;
    this.name = model?.name;
    this.initial_columns = model?.initial_columns ?? [];
  }

  withBaseTable(base_table?: number): QueryModel {
    return new QueryModel({
      base_table,
      id: this.id,
      name: this.name,
    });
  }

  withId(id: number): QueryModel {
    return new QueryModel({
      ...this,
      id,
    });
  }

  withName(name: string): QueryModel {
    return new QueryModel({
      ...this,
      name,
    });
  }

  addColumn(column: QueryInitialColumn): QueryModel {
    const baseAlias = `${column.tableName}_${column.name}`;
    const initialColumns = this.initial_columns ?? [];
    const allAliases = new Set(initialColumns.map((c) => c.alias));
    const alias = getAvailableName(baseAlias, allAliases);

    return new QueryModel({
      ...this,
      initial_columns: [
        ...initialColumns,
        {
          alias,
          id: column.id,
          jpPath: column.jpPath,
        },
      ],
    });
  }

  // deleteColumn() {

  // }

  isSaveable(): boolean {
    return (
      isDefinedNonNullable(this.base_table) &&
      isDefinedNonNullable(this.name) &&
      this.name.trim() !== ''
    );
  }

  serialize(): string {
    return JSON.stringify(this);
  }

  // TODO: Implement better type safety here
  static deserialize(jsonString: string): QueryModel {
    const parsedJSON: unknown = JSON.parse(jsonString);
    if (typeof parsedJSON === 'object' && parsedJSON !== null) {
      return new QueryModel(parsedJSON);
    }
    return new QueryModel();
  }
}
