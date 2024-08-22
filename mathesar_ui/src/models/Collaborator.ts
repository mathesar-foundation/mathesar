import { type Readable, type Writable, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { RawCollaborator } from '@mathesar/api/rpc/collaborators';
import { CancellablePromise } from '@mathesar/component-library';

import type { ConfiguredRole } from './ConfiguredRole';
import type { Database } from './Database';

export class Collaborator {
  readonly id;

  readonly user_id;

  readonly _configured_role_id: Writable<ConfiguredRole['id']>;

  get configured_role_id(): Readable<ConfiguredRole['id']> {
    return this._configured_role_id;
  }

  readonly database;

  constructor(props: { database: Database; rawCollaborator: RawCollaborator }) {
    this.id = props.rawCollaborator.id;
    this.user_id = props.rawCollaborator.user_id;
    this._configured_role_id = writable(
      props.rawCollaborator.configured_role_id,
    );
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
            this._configured_role_id.set(rawCollaborator.configured_role_id);
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
