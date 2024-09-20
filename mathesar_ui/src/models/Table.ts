import { api } from '@mathesar/api/rpc';
import type { RawTableWithMetadata } from '@mathesar/api/rpc/tables';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
import { CancellablePromise, ImmutableMap } from '@mathesar-component-library';

import { ObjectCurrentAccess } from './internal/ObjectCurrentAccess';
import type { Role } from './Role';
import type { Schema } from './Schema';

export class Table {
  oid: number;

  name: string;

  description: string | null;

  metadata;

  readonly schema;

  readonly currentAccess;

  constructor(props: {
    schema: Schema;
    rawTableWithMetadata: RawTableWithMetadata;
  }) {
    this.oid = props.rawTableWithMetadata.oid;
    this.name = props.rawTableWithMetadata.name;
    this.description = props.rawTableWithMetadata.description;
    this.metadata = props.rawTableWithMetadata.metadata;
    this.currentAccess = new ObjectCurrentAccess(props.rawTableWithMetadata);
    this.schema = props.schema;
  }

  updateOwner(newOwner: Role['oid']) {
    const promise = api.tables.privileges
      .transfer_ownership({
        database_id: this.schema.database.id,
        table_oid: this.oid,
        new_owner_oid: newOwner,
      })
      .run();

    return new CancellablePromise(
      (resolve, reject) => {
        promise
          .then((result) => {
            this.currentAccess.set(result);
            return resolve(this);
          }, reject)
          .catch(reject);
      },
      () => promise.cancel(),
    );
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
