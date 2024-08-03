import type { RawConfiguredRole } from './apiTypes';
import type { Server } from './Server';

export class ConfiguredRole {
  id: number;

  name: string;

  server: Server;

  constructor(p: { server: Server; rawConfiguredRole: RawConfiguredRole }) {
    this.id = p.rawConfiguredRole.id;
    this.name = p.rawConfiguredRole.name;
    this.server = p.server;
  }
}
