import type { Readable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { RawRole, RawRoleMember } from '@mathesar/api/rpc/roles';
import {
  CancellablePromise,
  type ImmutableMap,
  WritableMap,
} from '@mathesar-component-library';

import { ConfiguredRole } from './ConfiguredRole';
import type { Database } from './Database';

function getMembersWritableMap(members: RawRole['members']) {
  return new WritableMap((members ?? []).map((member) => [member.oid, member]));
}

export class Role {
  readonly oid: number;

  readonly name: string;

  readonly super: boolean;

  readonly inherits: boolean;

  readonly createRole: boolean;

  readonly createDb: boolean;

  readonly login: boolean;

  readonly description?: string;

  private _members;

  get members(): Readable<ImmutableMap<RawRoleMember['oid'], RawRoleMember>> {
    return this._members;
  }

  readonly database: Database;

  constructor(props: { database: Database; rawRole: RawRole }) {
    this.oid = props.rawRole.oid;
    this.name = props.rawRole.name;
    this.super = props.rawRole.super;
    this.inherits = props.rawRole.inherits;
    this.createRole = props.rawRole.create_role;
    this.createDb = props.rawRole.create_db;
    this.login = props.rawRole.login;
    this.description = props.rawRole.description;
    this._members = getMembersWritableMap(props.rawRole.members);
    this.database = props.database;
  }

  configure(password: string): CancellablePromise<ConfiguredRole> {
    const promise = api.configured_roles
      .add({
        server_id: this.database.server.id,
        name: this.name,
        password,
      })
      .run();

    return new CancellablePromise(
      (resolve, reject) => {
        promise
          .then(
            (rawConfiguredRole) =>
              resolve(
                new ConfiguredRole({
                  database: this.database,
                  rawConfiguredRole,
                }),
              ),
            reject,
          )
          .catch(reject);
      },
      () => promise.cancel(),
    );
  }

  setMembers(memberOids: Set<Role['oid']>): CancellablePromise<Role> {
    const promise = api.roles
      .set_members({
        database_id: this.database.id,
        role_oid: this.oid,
        members: [...memberOids],
      })
      .run();

    return new CancellablePromise(
      (resolve, reject) => {
        promise
          .then((rawRole) => {
            const newMembers = rawRole.members ?? [];
            this._members.reconstruct(
              newMembers.map((member) => [member.oid, member]),
            );
            return resolve(this);
          }, reject)
          .catch(reject);
      },
      () => promise.cancel(),
    );
  }

  delete(): CancellablePromise<void> {
    return api.roles
      .delete({ database_id: this.database.id, role_oid: this.oid })
      .run();
  }
}
