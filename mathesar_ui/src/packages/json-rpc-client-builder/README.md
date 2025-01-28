# JSON-RPC Client Builder

This is a simple library that allows you to generate a client for an external API which conforms to the [JSON-RPC](https://www.jsonrpc.org/) spec (version 2.0).

## Example

### Defining your API

```ts
import { buildRpcApi, rpcMethodTypeContainer } from 'json-rpc-client-builder';

export const api = buildRpcApi({
  endpoint: '/api/rpc/v0/',
  getHeaders: () => ({ 'X-CSRFToken': Cookies.get('csrftoken') }),
  methodTree: {

    spacecrafts: {
      get: rpcMethodTypeContainer<
        {
          id: number,
        },
        Spacecraft,
      >();
      list: rpcMethodTypeContainer<
        {
          universe_id: number,
          is_active: boolean,
        },
        Spacecraft,
      >();
    }

  },
});
```

This will model a JSON-RPC API with two namespaced methods `spacecrafts.get` and `spacecrafts.list`. You can create arbitrarily deep method trees to model deeply-namespaced RPC methods.

### Calling the API

A non-batched call looks like:

```ts
/** @type {RpcRequest<Spacecraft>>} */
const request = api.spacecrafts.get({ id: 42 });

/** @type {CancellablePromise<Spacecraft>} */
const promise = request.run();

/** @type {Spacecraft} */
const spacecraft = await promise; // Might throw!
```

A batched call looks like:

```ts
/** @type {[RpcResponse<Spacecraft>, RpcResponse<Voyage>]} */
const [spacecraftResult, voyageResult] = await batchSend(
  api.spacecrafts.get({ id: 42 }),
  api.voyages.get({ id: 100 }),
);
```
