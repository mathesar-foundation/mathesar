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

  getConnectionString() {
    return `${this.host}:${this.port}`;
  }

  /**
   * Returns a Server object with default values for host and port.
   *
   * This is useful in cases where we need a Sever object but might not have all
   * the info to build one.
   *
   * This is okay because displaying server info is not an important feature of
   * the app, so it's better to fail gracefully than to throw an error and crash
   * the app.
   */
  static dummy(id: number): Server {
    return new Server({
      rawServer: {
        id,
        host: 'unknown',
        port: 0,
      },
    });
  }
}
