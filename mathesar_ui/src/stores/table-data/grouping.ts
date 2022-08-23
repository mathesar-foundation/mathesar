import type { GetRequestParams } from '@mathesar/api/tables/records';

export interface GroupEntry {
  readonly columnId: number;
  readonly preprocFnId?: string;
}

type TerseGroupEntry = [GroupEntry['columnId'], GroupEntry['preprocFnId']];

export type TerseGrouping = TerseGroupEntry[];

export class Grouping {
  entries: GroupEntry[];

  constructor({
    entries,
  }: {
    entries?: GroupEntry[];
  } = {}) {
    this.entries = entries ?? [];
  }

  hasColumn(columnId: GroupEntry['columnId']): boolean {
    return this.entries.some((entry) => entry.columnId === columnId);
  }

  withEntry(entry: GroupEntry): Grouping {
    return new Grouping({
      entries: [...this.entries, entry],
    });
  }

  withoutEntry(entryIndex: number): Grouping {
    return new Grouping({
      entries: [
        ...this.entries.slice(0, entryIndex),
        ...this.entries.slice(entryIndex + 1),
      ],
    });
  }

  withoutColumn(columnId: number): Grouping {
    return new Grouping({
      entries: this.entries.filter((entry) => entry.columnId !== columnId),
    });
  }

  recordsRequestParams(): Pick<GetRequestParams, 'grouping'> {
    if (!this.entries.length) {
      return {};
    }
    const request: GetRequestParams['grouping'] = {
      columns: [],
      preproc: [],
    };
    this.entries.forEach((entry) => {
      request.columns.push(entry.columnId);
      request.preproc?.push(entry.preprocFnId ?? null);
    });
    return {
      grouping: request,
    };
  }

  terse(): TerseGrouping {
    return this.entries.map((entry) => [entry.columnId, entry.preprocFnId]);
  }

  static fromTerse(terse: TerseGrouping): Grouping {
    return new Grouping({
      entries: terse.map((terseEntry) => ({
        columnId: terseEntry[0],
        preprocFnId: terseEntry[1],
      })),
    });
  }
}
