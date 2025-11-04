const DRAGGABLE_ITEM_ATTR = 'data-dnd-draggable';
const DROPPABLE_ITEM_ATTR = 'data-dnd-droppable';
const HANDLE_ATTR = 'data-dnd-drag-handle';
const PLACEHOLDER_CLASS = 'dnd-placeholder';

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

function ancestor(
  el: Element | null,
  pred: (e: Element) => boolean,
): HTMLElement | null {
  let cur: Element | null = el;
  while (cur) {
    if (pred(cur)) return cur as HTMLElement;
    cur = cur.parentElement;
  }
  return null;
}

function directDraggableChildren(container: Element) {
  return Array.from(container.children).filter(isDraggable);
}

function rect(el: Element) {
  const r = el.getBoundingClientRect();
  return {
    w: r.width,
    h: r.height,
    top: r.top + window.scrollY,
    left: r.left + window.scrollX,
  };
}

export function dnd<Item, ParentItem>(
  node: HTMLElement,
  controller: DndController<Item, ParentItem>,
) {
  const threshold = 4;

  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let dragging = false;

  let dragEl: DndElement<Item> | null = null;
  let fromParentEl: DndElement<ParentItem> | null = null;
  let fromIndex = -1;

  let ghostEl: HTMLElement | null = null;
  let placeholderEl: HTMLElement | null = null;
  let phHeight = 0;

  let lastParent: DndElement<ParentItem> | null = null;
  let lastIndex = -1;

  function makeGhost(src: HTMLElement) {
    const { w, h, top, left } = rect(src);
    const g = src.cloneNode(true) as HTMLElement;
    Object.assign(g.style, {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${w}px`,
      height: `${Math.max(1, Math.min(20, h))}px`,
      transform: 'translate(0,0)',
      pointerEvents: 'none',
      opacity: '0.9',
      zIndex: '999999',
      boxSizing: 'border-box',
    });
    g.dataset.ghost = 'true';
    document.body.appendChild(g);
    return g;
  }

  function ensurePlaceholder(height: number) {
    if (placeholderEl) return placeholderEl;
    const ph = document.createElement('div');
    ph.className = PLACEHOLDER_CLASS;
    Object.assign(ph.style, {
      height: `${Math.max(1, Math.min(30, height))}px`,
      border: '2px dashed #999',
      borderRadius: '8px',
      background: 'transparent',
      boxSizing: 'border-box',
    });
    placeholderEl = ph;
    return ph;
  }

  function cleanupVisuals() {
    ghostEl?.remove();
    ghostEl = null;
    if (placeholderEl?.parentElement) placeholderEl.remove();
    placeholderEl = null;
    phHeight = 0;
    lastParent = null;
    lastIndex = -1;
  }

  function illegalTarget(targetContainer: HTMLElement, dragged: HTMLElement) {
    return dragged === targetContainer || dragged.contains(targetContainer);
  }

  function findDropIndex(container: HTMLElement, pointerY: number) {
    const all = directDraggableChildren(container).filter(
      (el) => el !== dragEl,
    );
    if (all.length === 0) return 0;

    for (let i = 0; i < all.length; i += 1) {
      const r = all[i].getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (pointerY < mid) return i;
    }
    return all.length;
  }

  function insertPlaceholderAt(container: HTMLElement, index: number) {
    const kids = directDraggableChildren(container).filter(
      (el) => el !== dragEl,
    );
    const before = kids[index] ?? null;

    if (!placeholderEl) return;
    placeholderEl.style.height = `${Math.max(1, Math.min(30, phHeight))}px`;

    if (before) {
      if (
        placeholderEl.nextSibling === before &&
        placeholderEl.parentElement === container
      ) {
        return;
      }
      container.insertBefore(placeholderEl, before);
    } else {
      if (
        placeholderEl.parentElement === container &&
        placeholderEl.nextSibling === null
      ) {
        return;
      }
      container.appendChild(placeholderEl);
    }
  }

  function startDrag() {
    if (!dragEl || !fromParentEl) return;

    ghostEl = makeGhost(dragEl);
    dragEl.style.display = 'none';

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    dragging = true;

    ensurePlaceholder(phHeight);
    insertPlaceholderAt(fromParentEl, fromIndex);
  }

  function endDrag(commit: boolean) {
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    if (commit && dragging && dragEl && fromParentEl) {
      let finalIndex = lastIndex;
      if (
        lastParent &&
        dragEl.parentElement === lastParent &&
        fromIndex < lastIndex
      ) {
        finalIndex = Math.max(0, lastIndex);
      }
      const toParentElement = lastParent || fromParentEl;

      controller.onChange({
        item: dragEl.dndData.getItem(),
        fromParent: fromParentEl.dndData.getItem(),
        fromIndex,
        toParent: toParentElement.dndData.getItem(),
        toIndex: finalIndex < 0 ? fromIndex : finalIndex,
      });
    }

    if (dragEl) dragEl.style.display = '';
    cleanupVisuals();

    // release capture if still held
    if (dragEl && pointerId != null) {
      dragEl.releasePointerCapture(pointerId);
    }

    dragging = false;
    pointerId = null;
    dragEl = null;
    fromParentEl = null;
    fromIndex = -1;
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

    dragEl = draggableElement;
    phHeight = draggableElement.getBoundingClientRect().height;

    fromParentEl = ancestor(
      draggableElement.parentElement,
      isDroppable<ParentItem>,
    ) as DndElement<ParentItem>;
    if (!fromParentEl) return;
    fromIndex = directDraggableChildren(fromParentEl).indexOf(draggableElement);

    lastParent = fromParentEl;
    lastIndex = fromIndex;

    // On some browsers this reduces accidental scroll before drag threshold
    // passive:false is added on the listener
    // TODO: Re-test in mobile
    e.preventDefault?.();
  }

  function onPointerMove(e: PointerEvent) {
    if (pointerId == null || e.pointerId !== pointerId || !dragEl) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!dragging && Math.hypot(dx, dy) > threshold) startDrag();
    if (!dragging) return;
    if (ghostEl) ghostEl.style.transform = `translate(${dx}px, ${dy}px)`;

    const under = document.elementFromPoint(e.clientX, e.clientY);
    const container = ancestor(under, isDroppable) as DndElement<ParentItem>;
    if (!container) return;
    if (illegalTarget(container, dragEl)) return;

    const toIndex = findDropIndex(container, e.clientY);

    if (container !== lastParent || toIndex !== lastIndex) {
      lastParent = container;
      lastIndex = toIndex;

      ensurePlaceholder(phHeight);
      insertPlaceholderAt(container, toIndex);
    }

    // While dragging, prevent page from scrolling if touch-action wasn't set globally
    e.preventDefault?.();
  }

  function onPointerUp(e: PointerEvent) {
    if (pointerId == null || e.pointerId !== pointerId) return;
    endDrag(true);
  }

  function onPointerCancel(e: PointerEvent) {
    if (pointerId == null || e.pointerId !== pointerId) return;
    endDrag(false);
  }

  function onLostPointerCapture(e: PointerEvent) {
    if (pointerId == null || e.pointerId !== pointerId) return;
    // If capture is lost mid-drag (mobile? safari?), end drag
    endDrag(false);
  }

  node.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp, { passive: false });
  window.addEventListener('pointercancel', onPointerCancel);
  window.addEventListener('lostpointercapture', onLostPointerCapture);
  const onBlur = () =>
    onPointerCancel(
      new PointerEvent('pointercancel', { pointerId: pointerId ?? 0 }),
    );
  window.addEventListener('blur', onBlur);

  return {
    destroy() {
      node.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('lostpointercapture', onLostPointerCapture);
      window.removeEventListener('blur', onBlur);
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
