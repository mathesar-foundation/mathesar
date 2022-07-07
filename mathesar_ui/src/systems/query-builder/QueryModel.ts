/**
 * Column: Needs alias, display_name
 * Needs Transformations
 * TODO: Move interface to /api
 */

interface QueryModelInterface {
  readonly baseTable?: number;
  readonly id?: number;
  readonly name?: string;
  readonly columns?: {
    column: number;
    jpPath?: [number, number][]
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

  setBaseTable(baseTable: number): QueryModel {
    return new QueryModel({
      ...this,
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

  // addColumn() {

  // }

  // deleteColumn() {

  // }

  isSaveable(): boolean {
    return !!this.baseTable && this.columns.length > 0;
  }

  serialize(): string {
    return JSON.stringify({
      id: this.id,
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
