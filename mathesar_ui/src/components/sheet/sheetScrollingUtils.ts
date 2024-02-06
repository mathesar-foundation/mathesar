import { tick } from 'svelte';

// TODO: Create a common utility action to handle active element based scroll
function scrollToElement(htmlElement: HTMLElement | null): void {
  const activeRow = htmlElement?.parentElement;
  const container = document.querySelector('[data-sheet-body-element="list"]');
  if (!container || !activeRow) {
    return;
  }
  // Vertical scroll
  if (
    activeRow.offsetTop + activeRow.clientHeight + 40 >
    container.scrollTop + container.clientHeight
  ) {
    const offsetValue: number =
      container.getBoundingClientRect().bottom -
      activeRow.getBoundingClientRect().bottom -
      40;
    container.scrollTop -= offsetValue;
  } else if (activeRow.offsetTop - 30 < container.scrollTop) {
    container.scrollTop = activeRow.offsetTop - 30;
  }

  // Horizontal scroll
  if (
    htmlElement.offsetLeft + activeRow.clientWidth + 30 >
    container.scrollLeft + container.clientWidth
  ) {
    const offsetValue: number =
      container.getBoundingClientRect().right -
      htmlElement.getBoundingClientRect().right -
      30;
    container.scrollLeft -= offsetValue;
  } else if (htmlElement.offsetLeft - 30 < container.scrollLeft) {
    container.scrollLeft = htmlElement.offsetLeft - 30;
  }
}

export function scrollBasedOnActiveCell(): void {
  const activeCell: HTMLElement | null = document.querySelector(
    '[data-sheet-element="data-cell"].is-active',
  );
  scrollToElement(activeCell);
}

export function scrollBasedOnSelection(): void {
  const selectedCell: HTMLElement | null = document.querySelector(
    '[data-sheet-element="data-cell"].is-selected',
  );
  scrollToElement(selectedCell);
}

export async function autoScroll() {
  await tick();
  scrollBasedOnActiveCell();
}
