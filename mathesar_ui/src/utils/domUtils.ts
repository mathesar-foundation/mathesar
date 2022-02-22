export function focusAndSelectAll(element: HTMLInputElement): void {
  element.focus();
  element.setSelectionRange(0, element.value.length);
}
