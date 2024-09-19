import { type Readable, derived, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { RawSchema, SchemaPrivilege } from '@mathesar/api/rpc/schemas';
import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
import { CancellablePromise, ImmutableMap } from '@mathesar-component-library';

import type { Database } from './Database';
import type { Role } from './Role';

export class Schema {
  readonly oid: number;

  private _name;

  get name(): Readable<RawSchema['name']> {
    return this._name;
  }

  private _description;

  get description(): Readable<RawSchema['description']> {
    return this._description;
  }

  private _tableCount;

  get tableCount(): Readable<RawSchema['table_count']> {
    return this._tableCount;
  }

  private _ownerOid;

  get ownerOid(): Readable<RawSchema['owner_oid']> {
    return this._ownerOid;
  }

  private _currentRolePrivileges;

  get currentRolePrivileges(): Readable<RawSchema['current_role_priv']> {
    return this._currentRolePrivileges;
  }

  private _currentRoleOwns;

  get currentRoleOwns(): Readable<RawSchema['current_role_owns']> {
    return this._currentRoleOwns;
  }

  readonly isPublicSchema;

  readonly database: Database;

  constructor(props: { database: Database; rawSchema: RawSchema }) {
    this.oid = props.rawSchema.oid;
    this._name = writable(props.rawSchema.name);
    this.isPublicSchema = derived(this._name, ($name) => $name === 'public');
    this._description = writable(props.rawSchema.description);
    this._tableCount = writable(props.rawSchema.table_count);
    this._ownerOid = writable(props.rawSchema.owner_oid);
    this._currentRolePrivileges = writable(props.rawSchema.current_role_priv);
    this._currentRoleOwns = writable(props.rawSchema.current_role_owns);
    this.database = props.database;
  }

  updateNameAndDescription(props: {
    name: string;
    description: RawSchema['description'];
  }): CancellablePromise<Schema> {
    const promise = api.schemas
      .patch({
        database_id: this.database.id,
        schema_oid: this.oid,
        patch: props,
      })
      .run();

    return new CancellablePromise(
      (resolve, reject) => {
        promise
          .then(() => {
            this._name.set(props.name);
            this._description.set(props.description);
            return resolve(this);
          }, reject)
          .catch(reject);
      },
      () => promise.cancel(),
    );
  }

  updateOwner(newOwner: Role['oid']) {
    const promise = api.schemas.privileges
      .transfer_ownership({
        database_id: this.database.id,
        schema_oid: this.oid,
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

  setTableCount(count: number) {
    this._tableCount.set(count);
  }

  delete(): CancellablePromise<void> {
    return api.schemas
      .delete({
        database_id: this.database.id,
        schema_oid: this.oid,
      })
      .run();
  }

  constructSchemaPrivilegesStore() {
    return new AsyncRpcApiStore(api.schemas.privileges.list_direct, {
      postProcess: (rawSchemaPrivilegesForRoles) =>
        new ImmutableMap(
          rawSchemaPrivilegesForRoles.map((rawSchemaPrivilegesForRole) => [
            rawSchemaPrivilegesForRole.role_oid,
            rawSchemaPrivilegesForRole,
          ]),
        ),
    });
  }
}
