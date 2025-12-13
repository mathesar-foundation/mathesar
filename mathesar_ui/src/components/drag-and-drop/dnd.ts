const DRAGGABLE_ITEM_ATTR = 'data-dnd-draggable';
const DROPPABLE_ITEM_ATTR = 'data-dnd-droppable';
const HANDLE_ATTR = 'data-dnd-drag-handle';
const DRAGGING_CLASS = 'dnd-dragging';
const DRAG_OVER_CLASS = 'dnd-drag-over';

const DRAG_THRESHOLD = 4;
const GHOST_OPACITY_DRAGGING = '0.7';

export type DndChangeDetail<Item, ParentItem> = {
  item: Item;
  fromParent: ParentItem;
  fromIndex: number;
  toParent: ParentItem;
  toIndex: number;
};

export type DndController<Item, ParentItem> = {
  onChange: (detail: DndChangeDetail<Item, ParentItem>) => void;
};

interface DndElement<Item> extends HTMLElement {
  dndData: {
    getItem: () => Item;
  };
}

function isDroppable<ParentItem>(
  el: Element | null,
): el is DndElement<ParentItem> {
  return !!el && el.hasAttribute(DROPPABLE_ITEM_ATTR);
}

function isDraggable<Item>(el: Element | null): el is DndElement<Item> {
  return !!el && el.hasAttribute(DRAGGABLE_ITEM_ATTR);
}

function findAncestor(
  el: Element | null,
  predicate: (e: Element) => boolean,
): HTMLElement | null {
  let current: Element | null = el;
  while (current) {
    if (predicate(current)) return current as HTMLElement;
    current = current.parentElement;
  }
  return null;
}

function getDraggableChildren(container: Element) {
  return Array.from(container.children).filter(isDraggable);
}

function getElementRect(el: Element) {
  const rect = el.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
  };
}

export function dnd<Item, ParentItem>(
  node: HTMLElement,
  controller: DndController<Item, ParentItem>,
) {
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  let isEndingDrag = false;

  let dragElement: DndElement<Item> | null = null;
  let sourceParent: DndElement<ParentItem> | null = null;
  let sourceIndex = -1;

  let ghostElement: HTMLElement | null = null;
  let placeholderElement: HTMLElement | null = null;
  let placeholderHeight = 0;

  let targetParent: DndElement<ParentItem> | null = null;
  let targetIndex = -1;
  let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;

  function createGhost(source: HTMLElement): HTMLElement {
    ghostElement?.remove();

    const { width, height, top, left } = getElementRect(source);
    const ghost = source.cloneNode(true) as HTMLElement;

    Object.assign(ghost.style, {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      transform: 'translate(0,0)',
      pointerEvents: 'none',
      opacity: GHOST_OPACITY_DRAGGING,
      zIndex: '999999',
      boxSizing: 'border-box',
    });

    ghost.dataset.dndGhost = 'true';
    document.body.appendChild(ghost);
    ghostElement = ghost;
    return ghost;
  }

  function ensurePlaceholder(height: number): HTMLElement {
    if (placeholderElement) return placeholderElement;

    const placeholder = document.createElement('div');
    Object.assign(placeholder.style, {
      height: `${Math.max(0, height)}px`,
      border: '2px dashed var(--color-fg-subtle-2-muted)',
      borderRadius: 'var(--border-radius-m)',
      background: 'transparent',
      boxSizing: 'border-box',
    });
    placeholder.dataset.dndPlaceholder = 'true';
    placeholderElement = placeholder;
    return placeholder;
  }

  function cleanupVisuals(): void {
    if (cleanupTimeout) {
      clearTimeout(cleanupTimeout);
      cleanupTimeout = null;
    }

    if (placeholderElement?.parentElement) {
      placeholderElement.remove();
    }
    placeholderElement = null;

    ghostElement?.remove();
    ghostElement = null;

    placeholderHeight = 0;
    targetParent = null;
    targetIndex = -1;
  }

  function isValidTarget(
    targetContainer: HTMLElement,
    draggedElement: HTMLElement,
  ): boolean {
    return (
      draggedElement !== targetContainer &&
      !draggedElement.contains(targetContainer)
    );
  }

  function findDropIndex(container: HTMLElement, pointerY: number): number {
    const children = getDraggableChildren(container).filter(
      (el) => el !== dragElement,
    );

    if (children.length === 0) return 0;

    for (let i = 0; i < children.length; i += 1) {
      const rect = children[i].getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (pointerY < midpoint) return i;
    }

    return children.length;
  }

  function insertPlaceholderAt(container: HTMLElement, index: number) {
    if (!placeholderElement) return;

    const children = getDraggableChildren(container).filter(
      (el) => el !== dragElement,
    );
    const insertBefore = children[index] ?? null;

    const wasInDifferentContainer =
      placeholderElement.parentElement !== container;
    const needsMove =
      wasInDifferentContainer ||
      (insertBefore
        ? placeholderElement.nextSibling !== insertBefore
        : placeholderElement.nextSibling !== null);

    if (needsMove) {
      placeholderElement.style.height = `${Math.max(0, placeholderHeight)}px`;

      if (insertBefore) {
        container.insertBefore(placeholderElement, insertBefore);
      } else {
        container.appendChild(placeholderElement);
      }
    }
  }

  function startDrag() {
    if (!dragElement || !sourceParent) return;

    createGhost(dragElement);

    dragElement.classList.add(DRAGGING_CLASS);
    dragElement.style.display = 'none';

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    isDragging = true;

    ensurePlaceholder(placeholderHeight);
    insertPlaceholderAt(sourceParent, sourceIndex);
  }

  function notifyChange() {
    if (!dragElement?.dndData || !sourceParent?.dndData) {
      console.error('DnD: Missing dndData on element');
      return;
    }

    const finalIndex = targetIndex < 0 ? sourceIndex : targetIndex;
    const destinationParent = targetParent || sourceParent;

    if (!destinationParent.dndData) {
      console.error('DnD: Missing dndData on target parent element');
      return;
    }

    controller.onChange({
      item: dragElement.dndData.getItem(),
      fromParent: sourceParent.dndData.getItem(),
      fromIndex: sourceIndex,
      toParent: destinationParent.dndData.getItem(),
      toIndex: finalIndex,
    });
  }

  function endDrag(shouldCommit: boolean) {
    if (isEndingDrag) return;
    isEndingDrag = true;

    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    if (dragElement && pointerId !== null) {
      dragElement.releasePointerCapture(pointerId);
    }

    if (shouldCommit && isDragging && dragElement && sourceParent) {
      notifyChange();
    }

    if (dragElement) {
      dragElement.classList.remove(DRAGGING_CLASS);
      dragElement.style.display = '';
    }

    document
      .querySelectorAll(`[${DROPPABLE_ITEM_ATTR}].${DRAG_OVER_CLASS}`)
      .forEach((el) => el.classList.remove(DRAG_OVER_CLASS));

    cleanupVisuals();

    isDragging = false;
    pointerId = null;
    dragElement = null;
    sourceParent = null;
    sourceIndex = -1;
    isEndingDrag = false;
  }

  function onPointerDown(e: PointerEvent) {
    if (!e.isPrimary) return;

    if (!e.target || !(e.target instanceof Element)) return;

    const handle = e.target.closest(`[${HANDLE_ATTR}]`);
    if (!handle || !(handle instanceof HTMLElement)) return;

    const draggableElement = handle.closest(`[${DRAGGABLE_ITEM_ATTR}]`);
    if (!isDraggable<Item>(draggableElement)) return;

    pointerId = e.pointerId;
    draggableElement.setPointerCapture(pointerId);

    startX = e.clientX;
    startY = e.clientY;

    dragElement = draggableElement;
    placeholderHeight = draggableElement.getBoundingClientRect().height;

    sourceParent = findAncestor(
      draggableElement.parentElement,
      isDroppable<ParentItem>,
    ) as DndElement<ParentItem>;
    if (!sourceParent) return;

    sourceIndex = getDraggableChildren(sourceParent).indexOf(draggableElement);

    targetParent = sourceParent;
    targetIndex = sourceIndex;

    e.preventDefault?.();
  }

  function onPointerMove(e: PointerEvent) {
    if (pointerId === null || e.pointerId !== pointerId || !dragElement) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (!isDragging && Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD) {
      startDrag();
    }
    if (!isDragging) return;

    if (ghostElement) {
      requestAnimationFrame(() => {
        if (ghostElement) {
          ghostElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        }
      });
    }

    const elementUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
    const container = findAncestor(
      elementUnderPointer,
      isDroppable,
    ) as DndElement<ParentItem>;
    if (!container || !isValidTarget(container, dragElement)) return;

    const dropIndex = findDropIndex(container, e.clientY);

    if (container !== targetParent || dropIndex !== targetIndex) {
      if (targetParent && targetParent !== container) {
        targetParent.classList.remove(DRAG_OVER_CLASS);
      }
      if (!container.classList.contains(DRAG_OVER_CLASS)) {
        container.classList.add(DRAG_OVER_CLASS);
      }

      targetParent = container;
      targetIndex = dropIndex;

      ensurePlaceholder(placeholderHeight);
      insertPlaceholderAt(container, dropIndex);
    }

    e.preventDefault?.();
  }

  function onPointerUp(e: PointerEvent) {
    if (pointerId === null || e.pointerId !== pointerId) return;
    endDrag(true);
  }

  function onPointerCancel(e: PointerEvent) {
    if (pointerId === null || e.pointerId !== pointerId) return;
    endDrag(false);
  }

  function onLostPointerCapture(e: PointerEvent) {
    if (pointerId === null || e.pointerId !== pointerId) return;
    endDrag(false);
  }

  function onWindowBlur() {
    onPointerCancel(
      new PointerEvent('pointercancel', { pointerId: pointerId ?? 0 }),
    );
  }

  const eventOptions = { passive: false };

  node.addEventListener('pointerdown', onPointerDown, eventOptions);
  window.addEventListener('pointermove', onPointerMove, eventOptions);
  window.addEventListener('pointerup', onPointerUp, eventOptions);
  window.addEventListener('pointercancel', onPointerCancel, eventOptions);
  window.addEventListener(
    'lostpointercapture',
    onLostPointerCapture,
    eventOptions,
  );
  window.addEventListener('blur', onWindowBlur);

  return {
    destroy() {
      if (isDragging || dragElement) {
        endDrag(false);
      } else {
        cleanupVisuals();
      }

      node.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('lostpointercapture', onLostPointerCapture);
      window.removeEventListener('blur', onWindowBlur);
    },
  };
}

export function dndDraggable<Item>(
  node: HTMLElement,
  options: {
    getItem: () => Item;
  },
) {
  node.setAttribute(DRAGGABLE_ITEM_ATTR, '');
  const dndElement = node as DndElement<Item>;
  dndElement.dndData = {
    getItem: options.getItem,
  };
  return {};
}

export function dndDragHandle(node: HTMLElement) {
  node.setAttribute(HANDLE_ATTR, '');
  return {};
}

export function dndDroppable<ParentItem>(
  node: HTMLElement,
  options: {
    getItem: () => ParentItem;
  },
) {
  node.setAttribute(DROPPABLE_ITEM_ATTR, '');
  const dndElement = node as DndElement<ParentItem>;
  dndElement.dndData = {
    getItem: options.getItem,
  };
  return {};
}
