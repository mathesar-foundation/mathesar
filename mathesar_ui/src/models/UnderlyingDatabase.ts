import { api } from '@mathesar/api/rpc';
import type { RawUnderlyingDatabase } from '@mathesar/api/rpc/databases';
import { CancellablePromise } from '@mathesar-component-library';

import type { Database } from './Database';
import { ObjectCurrentAccess } from './internal/ObjectCurrentAccess';
import type { Role } from './Role';

export class UnderlyingDatabase {
  readonly oid: number;

  readonly currentAccess;

  readonly database: Database;

  constructor(props: {
    database: Database;
    rawUnderlyingDatabase: RawUnderlyingDatabase;
  }) {
    this.oid = props.rawUnderlyingDatabase.oid;
    this.currentAccess = new ObjectCurrentAccess(props.rawUnderlyingDatabase);
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
            this.currentAccess.set(result);
            return resolve(this);
          }, reject)
          .catch(reject);
      },
      () => promise.cancel(),
    );
  }
}
