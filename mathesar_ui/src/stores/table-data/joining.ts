import type { RecordsListParams } from '@mathesar/api/rpc/records';
import type { JoinPath } from '@mathesar/api/rpc/tables';
import { ImmutableMap } from '@mathesar-component-library';

/**
 * [intermediateTableOid, joinPath]
 */
export type TerseJoining = [number, JoinPath][];

export class Joining {
  simpleManyToMany: ImmutableMap<number, JoinPath>;

  constructor({
    simpleManyToMany,
  }: {
    simpleManyToMany?: ImmutableMap<number, JoinPath>;
  } = {}) {
    this.simpleManyToMany = simpleManyToMany ?? new ImmutableMap();
  }

  withSimpleManyToMany(
    intermediateTableOid: number,
    joinPath: JoinPath,
  ): Joining {
    return new Joining({
      simpleManyToMany: this.simpleManyToMany.withEntries([
        [intermediateTableOid, joinPath],
      ]),
    });
  }

  withoutSimpleManyToMany(intermediateTableOid: number): Joining {
    return new Joining({
      simpleManyToMany: this.simpleManyToMany.without(intermediateTableOid),
    });
  }

  terse(): TerseJoining {
    return [...this.simpleManyToMany].map(
      ([intermediateTableOid, joinPath]) => [intermediateTableOid, joinPath],
    );
  }

  static fromTerse(t: TerseJoining): Joining {
    return new Joining({
      simpleManyToMany: new ImmutableMap(
        t.map(([intermediateTableOid, joinPath]) => [
          intermediateTableOid,
          joinPath,
        ]),
      ),
    });
  }

  getSimpleManyToManyJoins(): {
    alias: string;
    intermediateTableOid: number;
    targetTableOid: number | undefined;
    joinPath: JoinPath;
  }[] {
    return [...this.simpleManyToMany].map(
      ([intermediateTableOid, joinPath]) => ({
        alias: `joined-${intermediateTableOid}`,
        intermediateTableOid,
        targetTableOid: joinPath[1]?.[1]?.[0],
        joinPath,
      }),
    );
  }

  recordsRequestParams(): Pick<RecordsListParams, 'joined_columns'> {
    const joinedColumns = this.getSimpleManyToManyJoins().map(
      ({ alias, joinPath }) => ({
        alias,
        join_path: joinPath,
      }),
    );

    if (!joinedColumns.length) {
      return {};
    }
    return {
      joined_columns: joinedColumns,
    };
  }
}
