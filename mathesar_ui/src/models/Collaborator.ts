import { type Readable, type Writable, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { RawCollaborator } from '@mathesar/api/rpc/collaborators';
import { CancellablePromise } from '@mathesar/component-library';

import type { ConfiguredRole } from './ConfiguredRole';
import type { Database } from './Database';

export class Collaborator {
  readonly id;

  readonly userId;

  readonly _configuredRoleId: Writable<ConfiguredRole['id']>;

  get configuredRoleId(): Readable<ConfiguredRole['id']> {
    return this._configuredRoleId;
  }

  readonly database;

  constructor(props: { database: Database; rawCollaborator: RawCollaborator }) {
    this.id = props.rawCollaborator.id;
    this.userId = props.rawCollaborator.user_id;
    this._configuredRoleId = writable(props.rawCollaborator.configured_role_id);
    this.database = props.database;
  }

  setConfiguredRole(
    configuredRoleId: ConfiguredRole['id'],
  ): CancellablePromise<Collaborator> {
    const promise = api.collaborators
      .set_role({
        collaborator_id: this.id,
        configured_role_id: configuredRoleId,
      })
      .run();

    return new CancellablePromise(
      (resolve, reject) => {
        promise
          .then((rawCollaborator) => {
            this._configuredRoleId.set(rawCollaborator.configured_role_id);
            return resolve(this);
          }, reject)
          .catch(reject);
      },
      () => promise.cancel(),
    );
  }

  delete() {
    return api.collaborators.delete({ collaborator_id: this.id }).run();
  }
}
