export function getRectCssGeometry(
  rect: DOMRect,
): Partial<CSSStyleDeclaration> {
  return {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  };
}

export function onElementRemoved(element: HTMLElement, fn: () => void): void {
  const mutationObserver = new MutationObserver(() => {
    if (element.isConnected) return;
    fn();
    mutationObserver.disconnect();
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

export function isVerticallyScrollable(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  const { overflowY } = style;
  return (
    (overflowY === 'auto' || overflowY === 'scroll') &&
    element.scrollHeight > element.clientHeight
  );
}

export function getNearestVerticallyScrollableAncestor(
  element: HTMLElement,
): HTMLElement | undefined {
  const parent = element.parentElement;
  if (!parent) return undefined;
  return isVerticallyScrollable(parent)
    ? parent
    : getNearestVerticallyScrollableAncestor(parent);
}

export function* getNewlyAddedItemsFromMutations(
  mutations: Iterable<MutationRecord>,
): Generator<HTMLElement> {
  for (const mutation of mutations) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      for (const node of mutation.addedNodes) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node instanceof HTMLElement
        ) {
          yield node;
        }
      }
    }
  }
}
