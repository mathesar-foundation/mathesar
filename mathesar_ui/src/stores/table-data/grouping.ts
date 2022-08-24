import type { GetRequestParams } from '@mathesar/api/tables/records';
import { isDefinedNonNullable } from '@mathesar/component-library';

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

  withoutColumn(columnId: number): Grouping {
    return new Grouping({
      entries: this.entries.filter((entry) => entry.columnId !== columnId),
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
    if (request.preproc?.every((entry) => !isDefinedNonNullable(entry))) {
      request.preproc = null;
    }
    return {
      grouping: request,
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
