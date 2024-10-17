import type { RecordsListParams } from '@mathesar/api/rpc/records';

export interface GroupEntry {
  readonly columnId: number;
  readonly preprocFnId?: string;
}

type TerseGroupEntry =
  | [GroupEntry['columnId'], GroupEntry['preprocFnId']]
  | [GroupEntry['columnId']];

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

  withReplacedEntry(entryIndex: number, entry: GroupEntry): Grouping {
    return new Grouping({
      entries: this.entries.map((existingEntry, index) => {
        if (index === entryIndex) {
          return entry;
        }
        return existingEntry;
      }),
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

  withoutColumns(columnIds: number[]): Grouping {
    return new Grouping({
      entries: this.entries.filter(
        (entry) => !columnIds.includes(entry.columnId),
      ),
    });
  }

  withPreprocForColumn(columnId: number, preprocFnId?: string): Grouping {
    return new Grouping({
      entries: this.entries.map((entry) => {
        if (entry.columnId === columnId) {
          return {
            columnId,
            preprocFnId,
          };
        }
        return entry;
      }),
    });
  }

  recordsRequestParams(): Pick<RecordsListParams, 'grouping'> {
    if (!this.entries.length) {
      return {};
    }
    return {
      grouping: {
        columns: this.entries.map((e) => e.columnId),
        preproc: this.entries.map((e) => e.preprocFnId ?? null),
      },
    };
  }

  terse(): TerseGrouping {
    return this.entries.map((entry) =>
      entry.preprocFnId
        ? [entry.columnId, entry.preprocFnId]
        : [entry.columnId],
    );
  }

  static fromTerse(terse: TerseGrouping): Grouping {
    return new Grouping({
      entries: terse.map((terseEntry) => ({
        columnId: terseEntry[0],
        preprocFnId: terseEntry[1] ?? undefined,
      })),
    });
  }
}
