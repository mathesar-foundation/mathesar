function recursiveFilter<T>(
  tree: T[],
  getAndSetChildren:
    | {
        get: (entry: T) => T[] | undefined;
        set: (entry: T, children?: T[]) => T;
      }
    | undefined = undefined,
  conditionFn: (entry: T) => boolean,
): T[] {
  const filteredTree: T[] = [];
  tree.forEach((entry) => {
    const childTree = getAndSetChildren?.get(entry);
    if (childTree) {
      const filteredChildTree = recursiveFilter(
        childTree,
        getAndSetChildren,
        conditionFn,
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
  getAndSetChildren:
    | {
        get: (entry: T) => T[] | undefined;
        set: (entry: T, children?: T[]) => T;
      }
    | undefined = undefined,
  searchTerm: string,
): T[] {
  const filterText = searchTerm?.trim();
  if (!filterText) {
    return tree;
  }
  return recursiveFilter(
    tree,
    getAndSetChildren,
    (entry: T) =>
      getValueToSearchBy(entry)
        ?.toLowerCase()
        .indexOf(searchTerm.toLowerCase()) > -1,
  );
}
