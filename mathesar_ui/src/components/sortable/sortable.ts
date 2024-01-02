const CONTAINER_ATTR = 'data-sortable-container';
const ITEM_ATTR = 'data-sortable-item';
const TRIGGER_ATTR = 'data-sortable-trigger';
const DRAGGING_CLASS = 'is-dragging';
const SORTING_CLASS = 'is-sorting';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface Controller<Item> {
  isSorting: boolean;
  getItems: () => Item[];
  onSort: (newItems: Item[]) => void;
}

interface ContainerElement<Item> extends HTMLElement {
  sortableController: Controller<Item>;
}

function getItemFromTrigger(element: HTMLElement): HTMLElement | undefined {
  if (element.hasAttribute(ITEM_ATTR)) return element;
  return (element.closest(`[${ITEM_ATTR}]`) ?? undefined) as
    | HTMLElement
    | undefined;
}

function getContainerFromTrigger<Item>(
  element: HTMLElement,
): ContainerElement<Item> | undefined {
  return (element.closest(`[${CONTAINER_ATTR}]`) ?? undefined) as
    | ContainerElement<Item>
    | undefined;
}

function preventDefault(e: Event) {
  e.preventDefault();
}

function midpoint(rect: DOMRect) {
  return rect.top + rect.height / 2;
}

function setTransform(element: HTMLElement, value: number) {
  if (value === 0) element.style.removeProperty('transform');
  element.style.setProperty('transform', `translateY(${value}px)`);
}

function analyze(container: HTMLElement, draggingItem: HTMLElement) {
  const containerRect = container.getBoundingClientRect();
  const items = container.querySelectorAll<HTMLElement>(`[${ITEM_ATTR}]`);
  const itemIndexes = [...Array(items.length).keys()];
  const rects = [...items].map((i) => i.getBoundingClientRect());
  const draggingItemIndex = [...items].indexOf(draggingItem);
  const draggingItemRect = rects[draggingItemIndex];
  return {
    items,
    draggingItemIndex,
    draggingItemHeight: draggingItemRect.height,
    draggingItemMarginTop: rects[draggingItemIndex - 1]
      ? draggingItemRect.top - rects[draggingItemIndex - 1].bottom
      : 0,
    draggingItemMarginBottom: rects[draggingItemIndex + 1]
      ? rects[draggingItemIndex + 1].top - draggingItemRect.bottom
      : 0,
    /** The most extreme negative drag change possible for the item */
    minDelta: containerRect.top - draggingItemRect.top,
    /** The most extreme positive drag change possible for the item */
    maxDelta: containerRect.bottom - draggingItemRect.bottom,
    /**
     * An array of lower bounds which describe the possible destination
     * positions to which the dragging item can be moved. For each entry in this
     * array, the index indicates the destination index, and the value indicates
     * the minimum possible drag delta required to move the dragging item to
     * that destination. Adjacent entries in this array can be used to validate
     * a potential destination index, given the drag delta.
     *
     * The bounds are computed such that the leading edge of the dragging item
     * must be moved to the midpoint of the destination item in order for the
     * destination to be valid.
     */
    destinationsLowerBounds: itemIndexes.map((i) => {
      if (i === 0) return -Infinity;
      if (i <= draggingItemIndex) {
        return midpoint(rects[i - 1]) - draggingItemRect.top;
      }
      return midpoint(rects[i]) - draggingItemRect.bottom;
    }),
  };
}
type Analysis = ReturnType<typeof analyze>;

/**
 * Walks through destinations from a best-guess starting point to efficiently
 * find a matching destination.
 *
 * In theory we could make this function much simpler by searching through
 * destinations using `findIndex` or similar, which would obviate the need to
 * supply a `destinationToTry`. But, given that the new destination will almost
 * always be adjacent to the old destination, we can make this much more
 * efficient using a walking search. Efficiency is important because this is
 * called on every pointer move event.
 */
function getDestination(
  delta: number,
  destinationToTry: number,
  destinationsLowerBounds: number[],
  /**
   * The direction we're moving with our walking search. 0 indicates we haven't
   * started walking yet.
   */
  searchDirection: -1 | 0 | 1 = 0,
): number {
  const target = destinationToTry + searchDirection;

  // Test if lower bounds are met
  if (searchDirection === -1 || searchDirection === 0) {
    const lowerBound = destinationsLowerBounds[target];
    if (delta < lowerBound) {
      // Continue searching lower destinations
      return getDestination(delta, target, destinationsLowerBounds, -1);
    }
  }

  // Test if upper bounds are met
  if (searchDirection === 1 || searchDirection === 0) {
    const upperBound = destinationsLowerBounds[target + 1] ?? Infinity;
    if (delta > upperBound) {
      // Continue searching higher destinations
      return getDestination(delta, target, destinationsLowerBounds, 1);
    }
  }

  return target;
}

function getItemShift(
  itemIndex: number,
  analysis: Analysis,
  destination: number,
): number {
  const {
    draggingItemIndex,
    draggingItemHeight,
    draggingItemMarginBottom,
    draggingItemMarginTop,
  } = analysis;
  if (itemIndex >= destination && itemIndex < draggingItemIndex) {
    // We are shifting the item down
    return draggingItemHeight + draggingItemMarginTop;
  }
  if (itemIndex <= destination && itemIndex > draggingItemIndex) {
    // We are shifting the item up
    return -1 * (draggingItemHeight + draggingItemMarginBottom);
  }
  return 0;
}

/** A Svelte action for the element containing all sortable items */
export function sortableContainer<Item>(
  node: HTMLElement,
  options: {
    getItems: () => Item[];
    onSort: (newItems: Item[]) => void;
  },
) {
  node.setAttribute(CONTAINER_ATTR, '');
  const containerElement = node as ContainerElement<Item>;
  containerElement.sortableController = {
    isSorting: false,
    getItems: options.getItems,
    onSort: options.onSort,
  };
  return {};
}

/** A Svelte action for each sortable item */
export function sortableItem(itemElement: Element) {
  itemElement.setAttribute(ITEM_ATTR, '');
  return {};
}

/** A Svelte action for the drag trigger element within each sortable item */
export function sortableTrigger(triggerElement: HTMLElement) {
  let containerElement: ContainerElement<unknown>;
  let itemElement: HTMLElement;
  let initialY: number;
  let destination: number;
  let analysis: Analysis;

  function arrange() {
    for (const [itemIndex, item] of analysis.items.entries()) {
      if (itemIndex === analysis.draggingItemIndex) continue;
      setTransform(item, getItemShift(itemIndex, analysis, destination));
    }
  }

  function handlePointerMove(event: PointerEvent) {
    const rawDelta = event.clientY - initialY;
    const clampedDelta = clamp(rawDelta, analysis.minDelta, analysis.maxDelta);
    setTransform(itemElement, clampedDelta);
    const newDestination = getDestination(
      clampedDelta,
      destination,
      analysis.destinationsLowerBounds,
    );
    if (newDestination !== destination) {
      destination = newDestination;
      arrange();
    }
  }

  function handlePointerUp(event: PointerEvent) {
    triggerElement.removeEventListener('pointermove', handlePointerMove);
    triggerElement.removeEventListener('pointerup', handlePointerUp);
    triggerElement.removeEventListener('pointercancel', handlePointerUp);
    window.removeEventListener('selectstart', preventDefault);
    triggerElement.releasePointerCapture(event.pointerId);
    containerElement.classList.remove(SORTING_CLASS);
    itemElement.classList.remove(DRAGGING_CLASS);
    const controller = containerElement.sortableController;
    controller.isSorting = false;

    for (const item of analysis.items) {
      setTransform(item, 0);
    }

    if (analysis.draggingItemIndex !== destination) {
      const items = [...controller.getItems()];
      const draggedItem = items.splice(analysis.draggingItemIndex, 1)[0];
      items.splice(destination, 0, draggedItem);
      void controller.onSort(items);
    }
  }

  function handlePointerDown(event: PointerEvent) {
    const item = getItemFromTrigger(triggerElement);
    if (!item) return;
    itemElement = item;
    const container = getContainerFromTrigger(triggerElement);
    if (!container) return;
    containerElement = container;
    containerElement.classList.add(SORTING_CLASS);
    const controller = containerElement.sortableController;
    if (controller.isSorting) return; // To prevent multi-touch
    controller.isSorting = true;
    itemElement.classList.add(DRAGGING_CLASS);
    analysis = analyze(containerElement, itemElement);
    destination = analysis.draggingItemIndex;
    initialY = event.clientY;
    triggerElement.setPointerCapture(event.pointerId);
    triggerElement.addEventListener('pointermove', handlePointerMove);
    triggerElement.addEventListener('pointerup', handlePointerUp);
    triggerElement.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('selectstart', preventDefault);
  }

  triggerElement.setAttribute(TRIGGER_ATTR, '');
  triggerElement.addEventListener('pointerdown', handlePointerDown);
  triggerElement.addEventListener('contextmenu', preventDefault);
  return {
    destroy() {
      triggerElement.removeEventListener('pointerdown', handlePointerDown);
    },
  };
}
