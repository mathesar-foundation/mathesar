/**
 * Column: Needs alias, display_name
 * Needs Transformations
 * TODO: Move interface to /api
 */

import { getAvailableName } from '@mathesar/utils/db';
import type { TableEntry, JpPath } from '@mathesar/api/tables/tableList';
import type { Column } from '@mathesar/api/tables/columns';

export interface QueryInitialColumn {
  id: Column['id'];
  name: Column['name'];
  tableName: TableEntry['name'];
  jpPath?: JpPath;
}

interface QueryModelInterface {
  readonly baseTable?: number;
  readonly id?: number;
  readonly name?: string;
  readonly columns?: {
    alias: string;
    column: Column['id'];
    jpPath?: JpPath;
  }[];
}

export default class QueryModel implements QueryModelInterface {
  baseTable;

  id;

  name;

  columns;

  constructor(model?: QueryModelInterface) {
    this.baseTable = model?.baseTable;
    this.id = model?.id;
    this.name = model?.name;
    this.columns = model?.columns ?? [];
  }

  setBaseTable(baseTable?: number): QueryModel {
    return new QueryModel({
      name: this.name,
      baseTable,
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
    const allAliases = new Set(this.columns.map((c) => c.alias));
    const alias = getAvailableName(baseAlias, allAliases);

    return new QueryModel({
      ...this,
      columns: [
        ...this.columns,
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
    return !!this.baseTable && this.columns.length > 0;
  }

  serialize(): string {
    return JSON.stringify({
      baseTable: this.baseTable,
      id: this.id,
      name: this.name,
      columns: this.columns,
    });
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
