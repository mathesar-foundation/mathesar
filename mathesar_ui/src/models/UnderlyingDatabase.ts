import { type Readable, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { RawUnderlyingDatabase } from '@mathesar/api/rpc/databases';
import { CancellablePromise } from '@mathesar-component-library';

import type { Database } from './Database';
import type { Role } from './Role';

export class UnderlyingDatabase {
  readonly oid: number;

  private _ownerOid;

  get ownerOid(): Readable<RawUnderlyingDatabase['owner_oid']> {
    return this._ownerOid;
  }

  private _currentRolePrivileges;

  get currentRolePrivileges(): Readable<
    RawUnderlyingDatabase['current_role_priv']
  > {
    return this._currentRolePrivileges;
  }

  private _currentRoleOwns;

  get currentRoleOwns(): Readable<RawUnderlyingDatabase['current_role_owns']> {
    return this._currentRoleOwns;
  }

  readonly database: Database;

  constructor(props: {
    database: Database;
    rawUnderlyingDatabase: RawUnderlyingDatabase;
  }) {
    this.oid = props.rawUnderlyingDatabase.oid;
    this._ownerOid = writable(props.rawUnderlyingDatabase.owner_oid);
    this._currentRolePrivileges = writable(
      props.rawUnderlyingDatabase.current_role_priv,
    );
    this._currentRoleOwns = writable(
      props.rawUnderlyingDatabase.current_role_owns,
    );
    this.database = props.database;
  }

  updateOwner(newOwner: Role['oid']) {
    const promise = api.databases.privileges
      .transfer_ownership({
        database_id: this.database.id,
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
}
