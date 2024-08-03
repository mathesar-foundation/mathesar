import type { RawRole } from './apiTypes';
import type { Server } from './Server';

export class Role {
  oid: number;

  name: string;

  server: Server;

  constructor(p: { server: Server; rawRole: RawRole }) {
    this.oid = p.rawRole.oid;
    this.name = p.rawRole.name;
    this.server = p.server;
  }
}
