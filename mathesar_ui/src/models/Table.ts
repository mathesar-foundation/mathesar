import { type Readable, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { RawTableWithMetadata } from '@mathesar/api/rpc/tables';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
import { CancellablePromise, ImmutableMap } from '@mathesar-component-library';

import type { Role } from './Role';
import type { Schema } from './Schema';

export class Table {
  oid: number;

  name: string;

  description: string | null;

  metadata;

  schema;

  private _ownerOid;

  get ownerOid(): Readable<RawTableWithMetadata['owner_oid']> {
    return this._ownerOid;
  }

  private _currentRolePrivileges;

  get currentRolePrivileges(): Readable<
    RawTableWithMetadata['current_role_priv']
  > {
    return this._currentRolePrivileges;
  }

  private _currentRoleOwns;

  get currentRoleOwns(): Readable<RawTableWithMetadata['current_role_owns']> {
    return this._currentRoleOwns;
  }

  constructor(props: {
    schema: Schema;
    rawTableWithMetadata: RawTableWithMetadata;
  }) {
    this.oid = props.rawTableWithMetadata.oid;
    this.name = props.rawTableWithMetadata.name;
    this.description = props.rawTableWithMetadata.description;
    this.metadata = props.rawTableWithMetadata.metadata;
    this._ownerOid = writable(props.rawTableWithMetadata.owner_oid);
    this._currentRolePrivileges = writable(
      props.rawTableWithMetadata.current_role_priv,
    );
    this._currentRoleOwns = writable(
      props.rawTableWithMetadata.current_role_owns,
    );
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
            this._ownerOid.set(result.owner_oid);
            this._currentRolePrivileges.set(result.current_role_priv);
            this._currentRoleOwns.set(result.current_role_owns);
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
