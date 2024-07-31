import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { Server } from './servers';

export interface DatabaseResponse {
  id: number;
  name: string;
  server_id: Server['id'];
}

/**
 * TODO: Figure out a better place to move classes like these.
 * Perhaps `@mathesar/models/database`.
 *
 * Model classes should follow these rules:
 * - The class should be immutable.
 * - There should not be `undefined` properties.
 * - All properties should be readonly.
 *    - All properties should be initialized in the constructor.
 *    - If a property has to be changed, we should return a new class.
 * - Svelte stores should not be used inside Model classes.
 *    - The Model classes themselves can be contained in a Svelte store.
 *
 * Good:
 * ```
 * export class Model {
 *  readonly proprety: string;
 *
 *  constructor(value: string) {
 *    this.proprety = value;
 *  }
 *
 *  fetchAnotherProperty(): string {
 *    const anotherProperty = api.model.getAnotherProp();
 *    return anotherProperty;
 *  }
 *
 *  changeProperty(newValue: string): Model {
 *    return new Model(newValue);
 *  }
 * }
 * ```
 *
 * Bad:
 * ```
 * export class Model {
 *  // All properties should be readonly
 *  proprety: string;
 *
 *  // Do not have undefined properties
 *  anotherProp: string | undefined = undefined;
 *
 *  constructor(prop: string) {
 *    this.proprety = prop;
 *  }
 *
 *  fetchAnotherProperty(): string {
 *    // Do not cache here
 *    this.anotherProp = api.model.getAnotherProp();
 *    return this.anotherProp;
 *  }
 *
 *  changeProperty(newValue: string): Model {
 *    // Do not mutate propreties
 *    this.property = newValue;
 *    return this;
 *  }
 * }
 * ```
 */
export class Database implements DatabaseResponse {
  readonly id: number;

  readonly name: string;

  readonly server_id: number;

  readonly server_host: string;

  readonly server_port: number;

  constructor(databaseResponse: DatabaseResponse, server: Server) {
    this.id = databaseResponse.id;
    this.name = databaseResponse.name;
    if (databaseResponse.server_id !== server.id) {
      throw new Error('Server ids do not match');
    }
    this.server_id = databaseResponse.server_id;
    this.server_host = server.host;
    this.server_port = server.port;
  }
}

export const databases = {
  list: rpcMethodTypeContainer<
    {
      server_id?: DatabaseResponse['server_id'];
    },
    Array<DatabaseResponse>
  >(),
};
