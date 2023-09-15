const cssPropertiesThatAffectWidth = [
  'direction',
  'boxSizing',
  'paddingRight',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'fontFamily',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
] as const;

function measureTextWidth(
  text: string,
  computedStyle: CSSStyleDeclaration,
): number {
  /** Change to `true` to display the element used to measure text */
  const debug = false;
  const id = 'caret-position-measurement';
  if (debug) {
    document.getElementById(id)?.remove();
  }
  const div = document.createElement('div');
  div.id = id;
  document.body.appendChild(div);
  const { style } = div;
  style.position = 'absolute';
  style.top = '0px';
  style.zIndex = '999999999';
  style.backgroundColor = 'coral';
  style.width = 'max-content';
  style.whiteSpace = 'pre';
  if (!debug) {
    style.visibility = 'hidden';
  }
  for (const property of cssPropertiesThatAffectWidth) {
    style[property] = computedStyle[property];
  }
  div.textContent = text;
  const width = div.clientWidth;
  if (!debug) {
    div.remove();
  }
  return width;
}

/**
 * @see notes in [README.md](./README.md)
 */
export function scrollCaretIntoView(el: HTMLInputElement) {
  // Allow mutation of the `el` DOM element
  /* eslint-disable no-param-reassign */
  const { clientWidth, scrollWidth } = el;

  if (clientWidth >= scrollWidth) {
    // The text fits within the input, so we don't need to scroll.
    return;
  }

  const caretPosition = el.selectionEnd;
  if (!caretPosition) return;

  if (caretPosition === 0) {
    // The caret is at the start, so we scroll all the way to the left.
    el.scrollLeft = 0;
    return;
  }

  const content = el.value;

  if (caretPosition === content.length) {
    // The caret is at the end, so we scroll all the way to the right.
    el.scrollLeft = el.scrollWidth;
    return;
  }

  const textBeforeCaret = content.substring(0, caretPosition);
  const widthOfTextBeforeCaret = measureTextWidth(
    textBeforeCaret,
    window.getComputedStyle(el),
  );

  let buffer = 10;
  const overshoot =
    widthOfTextBeforeCaret - el.scrollLeft - clientWidth + buffer;
  if (overshoot > 0) {
    // The caret is off the right edge, so we scroll to the right.
    el.scrollLeft += overshoot;
    return;
  }

  buffer = 25;
  const undershoot = el.scrollLeft - widthOfTextBeforeCaret + buffer;
  // const undershoot = el.scrollLeft - widthOfTextBeforeCaret;
  if (undershoot > 0) {
    // The caret is off the left edge, so we scroll to the left.
    el.scrollLeft -= undershoot;
  }
  /* eslint-enable no-param-reassign */
}
