/**
 * Column: Needs alias, display_name
 * Needs Transformations
 * TODO: Move interface to /api
 */

import { getAvailableName } from '@mathesar/utils/db';
import type { QueryInstance } from '@mathesar/api/queries/queryList';
import type { TableEntry, JpPath } from '@mathesar/api/tables/tableList';
import type { Column } from '@mathesar/api/tables/columns';

export interface QueryInitialColumn {
  id: Column['id'];
  name: Column['name'];
  tableName: TableEntry['name'];
  jpPath?: JpPath;
}

export interface UnsavedQueryInstance
  extends Omit<QueryInstance, 'id' | 'name'>,
    Pick<Partial<QueryInstance>, 'id' | 'name'> {}

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

  setBaseTable(base_table?: number): QueryModel {
    return new QueryModel({
      name: this.name,
      base_table,
    });
  }

  setId(id: number): QueryModel {
    return new QueryModel({
      ...this,
      id,
    });
  }

  setName(name: string): QueryModel {
    return new QueryModel({
      ...this,
      name,
    });
  }

  addColumn(column: QueryInitialColumn): QueryModel {
    const baseAlias = `${column.tableName}_${column.name}`;
    const allAliases = new Set(this.initial_columns.map((c) => c.alias));
    const alias = getAvailableName(baseAlias, allAliases);

    return new QueryModel({
      ...this,
      initial_columns: [
        ...this.initial_columns,
        {
          alias,
          column: column.id,
          jpPath: column.jpPath,
        },
      ],
    });
  }

  // deleteColumn() {

  // }

  isSaveable(): boolean {
    return !!this.base_table && this.initial_columns.length > 0;
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
