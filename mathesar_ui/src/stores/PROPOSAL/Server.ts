import type { Readable } from 'svelte/store';

import { ImmutableMap, WritableMap } from '@mathesar/component-library';
import type AsyncStore from '@mathesar/stores/AsyncStore';

import type { RawConfiguredRole, RawRole, RawServer } from './apiTypes';
import type { ConfiguredRole } from './ConfiguredRole';
import type { Database } from './Database';
import type { Role } from './Role';

export class Server {
  id: number;

  host: string;

  port: string;

  databases: WritableMap<Database['id'], Database>;

  rolesList!: AsyncStore<void, RawRole[]>;

  roles!: Readable<ImmutableMap<Role['oid'], Role>>;

  configuredRolesList!: AsyncStore<void, RawConfiguredRole[]>;

  configuredRoles!: Readable<
    ImmutableMap<ConfiguredRole['id'], ConfiguredRole>
  >;

  constructor(rawServer: RawServer) {
    this.id = rawServer.id;
    this.host = rawServer.host;
    this.port = rawServer.port;
    this.databases = new WritableMap();
  }
}
