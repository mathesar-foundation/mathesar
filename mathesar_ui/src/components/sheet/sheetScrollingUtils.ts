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
  const cell = document.querySelector<HTMLElement>('[data-cell-active]');
  scrollToElement(cell);
}

export function scrollBasedOnSelection(): void {
  const cell = document.querySelector<HTMLElement>('[data-cell-selected]');
  scrollToElement(cell);
}

export async function autoScroll() {
  await tick();
  scrollBasedOnActiveCell();
}
