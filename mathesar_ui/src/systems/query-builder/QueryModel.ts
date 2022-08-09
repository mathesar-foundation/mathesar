import type { QueryInstanceInitialColumn } from '@mathesar/api/queries/queryList';
import { isDefinedNonNullable } from '@mathesar-component-library';
import type { UnsavedQueryInstance } from '@mathesar/stores/queries';

export interface QueryModelUpdateDiff {
  model: QueryModel;
  type:
    | 'id'
    | 'name'
    | 'baseTable'
    | 'initialColumnsArray'
    | 'initialColumnName';
  diff: Partial<UnsavedQueryInstance>;
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

  withBaseTable(base_table?: number): QueryModelUpdateDiff {
    const model = new QueryModel({
      base_table,
      id: this.id,
      name: this.name,
    });
    return {
      model,
      type: 'baseTable',
      diff: {
        base_table,
      },
    };
  }

  withId(id: number): QueryModelUpdateDiff {
    const model = new QueryModel({
      ...this,
      id,
    });
    return {
      model,
      type: 'id',
      diff: {
        id,
      },
    };
  }

  withName(name: string): QueryModelUpdateDiff {
    const model = new QueryModel({
      ...this,
      name,
    });
    return {
      model,
      type: 'name',
      diff: {
        name,
      },
    };
  }

  withColumn(column: QueryInstanceInitialColumn): QueryModelUpdateDiff {
    const initialColumns = [...this.initial_columns, column];
    const model = new QueryModel({
      ...this,
      initial_columns: initialColumns,
    });
    return {
      model,
      type: 'initialColumnsArray',
      diff: {
        initial_columns: initialColumns,
      },
    };
  }

  withoutColumn(columnAlias: string): QueryModelUpdateDiff {
    const initialColumns = this.initial_columns.filter(
      (entry) => entry.alias !== columnAlias,
    );
    const model = new QueryModel({
      ...this,
      initial_columns: initialColumns,
    });
    return {
      model,
      type: 'initialColumnsArray',
      diff: {
        initial_columns: initialColumns,
      },
    };
  }

  withDisplayNameForColumn(
    columnAlias: string,
    displayName: string,
  ): QueryModelUpdateDiff {
    const initialColumns = this.initial_columns.map((entry) => {
      if (entry.alias === columnAlias) {
        return {
          ...entry,
          display_name: displayName,
        };
      }
      return entry;
    });
    const model = new QueryModel({
      ...this,
      initial_columns: initialColumns,
    });
    return {
      model,
      type: 'initialColumnName',
      diff: {
        initial_columns: initialColumns,
      },
    };
  }

  getColumn(columnAlias: string): QueryInstanceInitialColumn | undefined {
    return this.initial_columns.find((column) => column.alias === columnAlias);
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
