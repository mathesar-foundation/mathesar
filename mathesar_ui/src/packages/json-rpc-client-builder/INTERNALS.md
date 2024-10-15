# Internal details of json-rpc-client-builder

This document describes how the code in this package works, because there's some weird magic happening here! The `json-rpc-client-builder` package encapsulates all of this magic so that consumers needn't worry about it. But from _within_ the package there is some TypeScript trickery. That trickery exists for the purpose of provide an ergonomic means for consumers to define and call their API methods.

Here's what's happening...

- When calling `buildRpcApi`, consumers of this package define the structure of their API by creating passing an object to the `methodTree` prop. That object is a _value_ — not a type.

- Within that `methodTree` object, package consumers use the `rpcMethodTypeContainer` function to indicate an RPC method at that position in the tree. When doing so, they define the input and output types for the API method. In TypeScript land, those types get tacked on to these leaf nodes of the method tree, but in a rather strange way... The `rpcMethodTypeContainer` function just returns an empty array (as a value), but it _types_ that value using a tuple type to represent the runtime input/output of the RPC method. This means the return value from `rpcMethodTypeContainer` is intentionally in disagreement with the return _type_ from that function.

- When `buildRpcApi` runs, it discards the empty arrays, putting the actual API request in their place. Fancy TS types make this all work out in the end (so long as the API actually behaves the way it is specified).

Why this approach?

- This was the best way I came up with to make an API that's really ergonomic to define and use.

- You might think that we could give consumers a better function to use instead of `rpcMethodTypeContainer` — one that returns a `RpcRequest` factory. Then we wouldn't need a builder function like `buildRpcApi`. But the problem here is the method names (and namespacing). Any function placed at the leaves of the tree won't be able to see the trunk and branches. And I didn't want to require consumers to specify the method names redundantly.

- I think this approach is okay because we don't expect package consumers to ever utilize the return value of `rpcMethodTypeContainer` outside of `buildRpcApi` which understands this weirdness.
