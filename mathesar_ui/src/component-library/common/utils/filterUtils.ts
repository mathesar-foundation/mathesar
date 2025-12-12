function recursiveFilter<T>(
  tree: T[],
  conditionFn: (entry: T) => boolean,
  getAndSetChildren:
    | {
        get: (entry: T) => T[] | undefined;
        set: (entry: T, children?: T[]) => T;
      }
    | undefined = undefined,
): T[] {
  const filteredTree: T[] = [];
  tree.forEach((entry) => {
    const childTree = getAndSetChildren?.get(entry);
    if (childTree) {
      const filteredChildTree = recursiveFilter(
        childTree,
        conditionFn,
        getAndSetChildren,
      );
      if (filteredChildTree.length > 0 && getAndSetChildren) {
        const filteredEntry = getAndSetChildren.set(
          {
            ...entry,
          },
          filteredChildTree,
        );
        filteredTree.push(filteredEntry);
      }
    } else if (conditionFn(entry)) {
      filteredTree.push(entry);
    }
  });
  return filteredTree;
}

export function filterTree<T>(
  tree: T[],
  getValueToSearchBy: (entry: T) => string,
  searchTerm: string,
  getAndSetChildren:
    | {
        get: (entry: T) => T[] | undefined;
        set: (entry: T, children?: T[]) => T;
      }
    | undefined = undefined,
): T[] {
  const filterText = searchTerm?.trim();
  if (!filterText) {
    return tree;
  }
  return recursiveFilter(
    tree,
    (entry: T) =>
      getValueToSearchBy(entry)
        ?.toLowerCase()
        .indexOf(searchTerm.toLowerCase()) > -1,
    getAndSetChildren,
  );
}
