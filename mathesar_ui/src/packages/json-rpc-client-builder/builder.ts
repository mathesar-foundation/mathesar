import { RpcRequest } from './requests';

type MethodTypeContainer<Params, Result> = [Params, Result];
type MethodTree = { [key: string]: MethodTreeNode };
type MethodTreeNode = MethodTree | MethodTypeContainer<unknown, unknown>;
type Api<Node extends MethodTreeNode> = Node extends MethodTypeContainer<
  infer Params,
  infer Result
>
  ? (params: Params) => RpcRequest<Result>
  : Node extends MethodTree
    ? { [MethodName in keyof Node]: Api<Node[MethodName]> }
    : never;

function nodeIsMethod(
  node: MethodTreeNode,
): node is MethodTypeContainer<unknown, unknown> {
  return Array.isArray(node);
}

export function rpcMethodTypeContainer<P, R>(): MethodTypeContainer<P, R> {
  // There is dark magic happening here! 🧙‍♂️ See INTERNALS.md for details.
  return [] as unknown as MethodTypeContainer<P, R>;
}

function handleNode<Node extends MethodTreeNode>(
  path: string[],
  endpoint: string,
  getHeaders: () => Record<string, string | undefined>,
  node: Node,
) {
  if (nodeIsMethod(node)) {
    return (params: unknown) =>
      new RpcRequest({ path, endpoint, params, getHeaders });
  }
  const transformedTree: Record<string, unknown> = {};
  for (const [pathSegment, branch] of Object.entries<MethodTreeNode>(node)) {
    transformedTree[pathSegment] = handleNode(
      [...path, pathSegment],
      endpoint,
      getHeaders,
      branch,
    );
  }
  return transformedTree;
}

export function buildRpcApi<Tree extends MethodTree>(p: {
  endpoint: string;
  getHeaders: () => Record<string, string | undefined>;
  methodTree: Tree;
}): Api<Tree> {
  return handleNode([], p.endpoint, p.getHeaders, p.methodTree) as Api<Tree>;
}
