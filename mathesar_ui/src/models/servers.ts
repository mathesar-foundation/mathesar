import type { RawServer } from '@mathesar/api/rpc/servers';

export class Server {
  readonly id: number;

  readonly host: string;

  readonly port: number;

  constructor(props: { rawServer: RawServer }) {
    this.id = props.rawServer.id;
    this.host = props.rawServer.host;
    this.port = props.rawServer.port;
  }
}
