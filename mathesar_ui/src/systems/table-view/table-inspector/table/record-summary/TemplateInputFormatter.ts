import type {
  InputFormatter,
  ParseResult,
} from '@mathesar-component-library/types';
import type { Column } from '@mathesar/api/tables/columns';

type ColumnLike = Pick<Column, 'id' | 'name'>;

export function columnIsUsable(column: ColumnLike): boolean {
  // If a column contains a curly brace, we can't use it within the template.
  return !column.name.match(/[{}]/);
}

export default class TemplateInputFormatter implements InputFormatter<string> {
  private readonly columns: ColumnLike[];

  constructor(columns: ColumnLike[]) {
    this.columns = columns.filter(columnIsUsable);
  }

  private getColumnName(columnId: number): string | undefined {
    return this.columns.find((c) => c.id === columnId)?.name;
  }

  private getColumnId(columnName: string): number | undefined {
    return this.columns.find((c) => c.name === columnName)?.id;
  }

  format(templateWithColumnIds: string): string {
    const tokenPattern = /\{\d+\}/g;
    return templateWithColumnIds.replace(tokenPattern, (token) => {
      const columnId = parseInt(token.slice(1, -1), 10);
      const columnName = this.getColumnName(columnId);
      if (columnName === undefined) {
        return token;
      }
      return `{${columnName}}`;
    });
  }

  parse(templateWithColumnNames: string): ParseResult<string> {
    const tokenPattern = /\{[^{}]+\}/g;
    const intermediateDisplay = templateWithColumnNames;
    const value = templateWithColumnNames.replace(tokenPattern, (token) => {
      const columnName = token.slice(1, -1);
      const columnId = this.getColumnId(columnName);
      if (columnId === undefined) {
        return token;
      }
      return `{${columnId}}`;
    });
    return { value, intermediateDisplay };
  }
}
