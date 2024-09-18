import type {
  RawTableWithMetadata,
  TablePrivilege,
} from '@mathesar/api/rpc/tables';

import type { Role } from './Role';
import type { Schema } from './Schema';

export class Table {
  oid: number;

  name: string;

  description: string | null;

  metadata;

  schema;

  owner_oid: Role['oid'];

  current_role_priv: TablePrivilege[];

  current_role_owns: boolean;

  constructor(props: {
    schema: Schema;
    rawTableWithMetadata: RawTableWithMetadata;
  }) {
    this.oid = props.rawTableWithMetadata.oid;
    this.name = props.rawTableWithMetadata.name;
    this.description = props.rawTableWithMetadata.description;
    this.metadata = props.rawTableWithMetadata.metadata;
    this.owner_oid = props.rawTableWithMetadata.owner_oid;
    this.current_role_priv = props.rawTableWithMetadata.current_role_priv;
    this.current_role_owns = props.rawTableWithMetadata.current_role_owns;
    this.schema = props.schema;
  }
}
