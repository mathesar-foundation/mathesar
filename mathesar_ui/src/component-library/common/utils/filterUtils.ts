function recursiveFilter(
  tree: Record<string, unknown>[],
  childKey: string,
  conditionFn: (entry: unknown) => boolean,
): Record<string, unknown>[] {
  const filteredTree: Record<string, unknown>[] = [];
  tree.forEach((entry) => {
    if (entry[childKey]) {
      const childTree = recursiveFilter(
        entry[childKey] as Record<string, unknown>[],
        childKey,
        conditionFn,
      );
      if (childTree.length > 0) {
        filteredTree.push({
          ...entry,
          [childKey]: childTree,
        });
      }
    } else if (conditionFn(entry)) {
      filteredTree.push(entry);
    }
  });
  return filteredTree;
}

export function filterTree(
  tree: Record<string, unknown>[],
  searchKey: string,
  childKey: string,
  searchTerm: string,
): Record<string, unknown>[] {
  const filterText = searchTerm?.trim();
  if (!filterText) {
    return tree;
  }
  return recursiveFilter(
    tree,
    childKey,
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    (entry: Record<string, unknown>) =>
      (entry[searchKey] as string)
        ?.toLowerCase()
        .indexOf(searchTerm.toLowerCase()) > -1,
  );
}
