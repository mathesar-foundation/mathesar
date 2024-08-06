import { type Writable, writable } from 'svelte/store';

import type { RawConfiguredRole } from './apiTypes';
import type { Server } from './Server';

export class ConfiguredRole {
  id: number;

  name: Writable<string>;

  server: Server;

  constructor(p: { server: Server; rawConfiguredRole: RawConfiguredRole }) {
    this.id = p.rawConfiguredRole.id;
    this.name = writable(p.rawConfiguredRole.name);
    this.server = p.server;
  }

  setPassword() {
    throw new Error('Not implemented yet');
  }
}
