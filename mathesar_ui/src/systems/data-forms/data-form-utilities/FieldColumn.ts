import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import { getDbTypeBasedInputCap } from '@mathesar/components/cell-fabric/utils';
import type { Table } from '@mathesar/models/Table';
import { getAbstractTypeForDbType } from '@mathesar/stores/abstract-types';
import type { AbstractType } from '@mathesar/stores/abstract-types/types';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import type { ComponentAndProps } from '@mathesar-component-library/types';

/**
 * We'd ideally like use ProcessedColumn here, however we do not have access to
 * constraints in the context of forms, especially when its anonymous.
 *
 * We would also like to phase out exposing and working with constraints directly on the
 * frontend, except where it is essential to do so. When we remove the dependency on
 * Constraints in ProcessedColumn, we could use it instead of FieldColumn.
 */
export class FieldColumn {
  readonly tableOid: number;

  readonly column: RawColumnWithMetadata;

  readonly abstractType: AbstractType;

  readonly foreignKeyLink?: {
    relatedTableOid: number;
  };

  readonly inputComponentAndProps: ComponentAndProps;

  constructor(props: {
    tableOid: Table['oid'];
    column: RawColumnWithMetadata;
    foreignKeyLink?: {
      relatedTableOid: number;
    };
  }) {
    this.tableOid = props.tableOid;
    this.column = props.column;
    this.foreignKeyLink = props.foreignKeyLink;
    this.abstractType = getAbstractTypeForDbType(this.column.type);
    this.inputComponentAndProps = getDbTypeBasedInputCap(
      this.column,
      props.foreignKeyLink?.relatedTableOid,
      this.abstractType.cellInfo,
    );
  }

  static fromProcessedColumn(pc: ProcessedColumn) {
    return new FieldColumn({
      tableOid: pc.tableOid,
      column: pc.column,
      foreignKeyLink: pc.linkFk
        ? {
            relatedTableOid: pc.linkFk.referent_table_oid,
          }
        : undefined,
    });
  }
}
