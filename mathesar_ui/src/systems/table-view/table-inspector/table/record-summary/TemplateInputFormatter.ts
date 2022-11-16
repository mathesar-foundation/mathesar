import type {
  InputFormatter,
  ParseResult,
} from '@mathesar-component-library/types';
import {
  columnIsConformant,
  type ColumnLike,
} from './recordSummaryTemplateUtils';

export default class TemplateInputFormatter implements InputFormatter<string> {
  private readonly columns: ColumnLike[];

  constructor(columns: ColumnLike[]) {
    this.columns = columns.filter(columnIsConformant);
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
