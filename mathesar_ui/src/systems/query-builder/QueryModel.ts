import type { QueryInstanceInitialColumn } from '@mathesar/api/queries/queryList';
import { isDefinedNonNullable } from '@mathesar-component-library';
import type { UnsavedQueryInstance } from '@mathesar/stores/queries';

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

  addColumn(column: QueryInstanceInitialColumn): QueryModel {
    const initialColumns = this.initial_columns ?? [];
    return new QueryModel({
      ...this,
      initial_columns: [...initialColumns, column],
    });
  }

  getColumn(columnAlias: string): QueryInstanceInitialColumn | undefined {
    return this.initial_columns.find((column) => column.alias === columnAlias);
  }

  deleteColumn(columnAlias: string): QueryModel {
    const initialColumns = this.initial_columns.filter(
      (entry) => entry.alias !== columnAlias,
    );
    if (initialColumns.length !== this.initial_columns.length) {
      return new QueryModel({
        ...this,
        initial_columns: initialColumns,
      });
    }
    return this;
  }

  updateColumnDisplayName(
    columnAlias: string,
    displayName: string,
  ): QueryModel {
    const initialColumns = this.initial_columns.map((entry) => {
      if (entry.alias === columnAlias) {
        return {
          ...entry,
          display_name: displayName,
        };
      }
      return entry;
    });
    return new QueryModel({
      ...this,
      initial_columns: initialColumns,
    });
  }

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
