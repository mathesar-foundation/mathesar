/* eslint-disable */

// Below code is taken from here and modified for FormattedInput use
// https://github.com/component/textarea-caret-position/blob/master/index.js

const properties = [
  'direction', // RTL support
  'boxSizing',
  'width', // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
  'height',
  'overflowX',
  'overflowY', // copy the scrollbar for IE

  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',

  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',

  // https://developer.mozilla.org/en-US/docs/Web/CSS/font
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',

  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration', // might not make a difference, but better be safe

  'letterSpacing',
  'wordSpacing',

  'tabSize',
  'MozTabSize',
];

const isBrowser = typeof window !== 'undefined';
const isFirefox = isBrowser && window.mozInnerScreenX != null;

// We'll copy the properties below into the mirror div.
// Note that some browsers, such as Firefox, do not concatenate properties
// into their shorthand (e.g. padding-top, padding-bottom etc. -> padding),
// so we have to list every single property explicitly.

export function getCaretCoordinates(
  element: HTMLInputElement,
  position: number,
) {
  let debug = false;
  if (debug) {
    let el = document.querySelector(
      '#input-textarea-caret-position-mirror-div',
    );
    if (el) el.parentNode?.removeChild(el);
  }

  // The mirror div will replicate the textarea's style
  let div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  let style = div.style;
  let computed = window.getComputedStyle
    ? window.getComputedStyle(element)
    : element.currentStyle; // currentStyle for IE < 9
  let isInput = element.nodeName === 'INPUT';

  // Default textarea styles
  style.whiteSpace = 'pre-wrap';
  if (!isInput) style.wordWrap = 'break-word'; // only for textarea-s

  // Position off-screen
  style.position = 'absolute'; // required to return coordinates properly
  if (!debug) style.visibility = 'hidden'; // not 'display: none' because we want rendering
  if (debug) {
    style.top = '0px';
    style.zIndex = '999999999';
    style.backgroundColor = 'green';
  }
  // Transfer the element's properties to the div
  properties.forEach(function (prop: string) {
    if (isInput && prop === 'lineHeight') {
      // Special case for <input>s because text is rendered centered and line height may be != height
      if (computed.boxSizing === 'border-box') {
        let height = parseInt(computed.height);
        let outerHeight =
          parseInt(computed.paddingTop) +
          parseInt(computed.paddingBottom) +
          parseInt(computed.borderTopWidth) +
          parseInt(computed.borderBottomWidth);
        let targetHeight = outerHeight + parseInt(computed.lineHeight);
        if (height > targetHeight) {
          style.lineHeight = height - outerHeight + 'px';
        } else if (height === targetHeight) {
          style.lineHeight = computed.lineHeight;
        } else {
          style.lineHeight = '0';
        }
      } else {
        style.lineHeight = computed.height;
      }
    } else {
      style[prop] = computed[prop];
    }
  });

  if (isFirefox) {
    // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
    if (element.scrollHeight > parseInt(computed.height))
      style.overflowY = 'scroll';
  } else {
    style.overflow = 'hidden'; // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
  }

  div.textContent = element.value.substring(0, position);
  // The second special handling for input type="text" vs textarea:
  // spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
  if (isInput) div.textContent = div.textContent.replace(/\s/g, '\u00a0');

  let span = document.createElement('span');
  span.style.zIndex = '999999';

  // Wrapping must be replicated *exactly*, including when a long word gets
  // onto the next line, with whitespace at the end of the line before (#7).
  // The  *only* reliable way to do that is to copy the *entire* rest of the
  // textarea's content into the <span> created at the caret position.
  // For inputs, just '.' would be enough, but no need to bother.
  span.textContent = element.value.substring(position) || '.'; // || because a completely empty faux span doesn't render at all
  div.appendChild(span);

  // Added diff method for FormattedInput
  // return diff offset in negative until scrolling is required
  // which can be directly used to scroll
  let diff =
    span.offsetLeft +
    parseInt(computed['borderLeftWidth']) -
    parseInt(div.style.width);
  let coordinates = {
    top: span.offsetTop + parseInt(computed['borderTopWidth']),
    left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
    height: parseInt(computed['lineHeight']),
    diff: diff,
  };

  if (debug) {
    span.style.backgroundColor = '#aaa';
  } else {
    document.body.removeChild(div);
  }

  return coordinates;
}
