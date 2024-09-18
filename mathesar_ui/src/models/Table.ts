import { api } from '@mathesar/api/rpc';
import type {
  RawTableWithMetadata,
  TablePrivilege,
} from '@mathesar/api/rpc/tables';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
import { ImmutableMap } from '@mathesar-component-library';

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

  constructTablePrivilegesStore() {
    return new AsyncRpcApiStore(api.tables.privileges.list_direct, {
      postProcess: (rawTablePrivilegesForRoles) =>
        new ImmutableMap(
          rawTablePrivilegesForRoles.map((rawTablePrivilegesForRole) => [
            rawTablePrivilegesForRole.role_oid,
            rawTablePrivilegesForRole,
          ]),
        ),
    });
  }
}
