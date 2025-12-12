/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable prefer-template */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

/**
 * Detect Element Resize.
 * https://github.com/sdecima/javascript-detect-element-resize
 * Version: 0.5.3
 * Sebastian Decima
 *
 * Ported from the fork of Detect Element Resize in react-virtualized-auto-resizer@1.0.5
 * https://github.com/bvaughn/react-virtualized-auto-sizer/blob/master/src/vendor/detectElementResize.js
 * MIT @ bvaughn
 *
 * This fork includes the following additional changes:
 * 1. Ported to TypeScript
 * 2. Updated to ES2021
 * 3. Support for attachEvent removed
 * 4. Support for SSR removed
 * 5. React/Preact specific handling removed
 *
 * ESLint rules are disabled temporarily until TS types are well defined
 * */

export interface ElementResizeDetector {
  addResizeListener: (node: HTMLElement, resizeCallback: () => void) => void;
  removeResizeListener: (node: HTMLElement, resizeCallback: () => void) => void;
}

interface Window extends globalThis.Window {
  mozRequestAnimationFrame?: (callback: FrameRequestCallback) => number;
  mozCancelAnimationFrame?: (id: unknown) => unknown;
}

function getRequestFrame(): (arg: unknown) => unknown {
  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  const raf: (arg: unknown) => unknown =
    window.requestAnimationFrame ||
    (window as Window).mozRequestAnimationFrame ||
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    window.webkitRequestAnimationFrame ||
    function fallback(fn: (arg: unknown) => unknown) {
      return window.setTimeout(fn, 20);
    };
  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  return (fn: (arg: unknown) => unknown) => raf(fn);
}

function getCancelFrame(): (arg: unknown) => unknown {
  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  const cancel: (arg: unknown) => void =
    window.cancelAnimationFrame ||
    (window as Window).mozCancelAnimationFrame ||
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    window.webkitCancelAnimationFrame ||
    window.clearTimeout;

  return (id: unknown): unknown => cancel(id);
}

// @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
function resetTriggers(element) {
  const triggers = element.__resizeTriggers__;
  const expand = triggers.firstElementChild;
  const contract = triggers.lastElementChild;
  const expandChild = expand.firstElementChild;

  contract.scrollLeft = contract.scrollWidth;
  contract.scrollTop = contract.scrollHeight;
  expandChild.style.width = expand.offsetWidth + 1 + 'px';
  expandChild.style.height = expand.offsetHeight + 1 + 'px';
  expand.scrollLeft = expand.scrollWidth;
  expand.scrollTop = expand.scrollHeight;
}

// @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
function checkTriggers(element) {
  return (
    element.offsetWidth !== element.__resizeLast__.width ||
    element.offsetHeight !== element.__resizeLast__.height
  );
}

export function createDetectElementResize(): ElementResizeDetector {
  const requestFrame = getRequestFrame();
  const cancelFrame = getCancelFrame();

  function scrollListener(e: Event) {
    const target = e.target as HTMLElement;
    // Don't measure (which forces) reflow for scrolls that happen inside of children!
    if (
      target.className?.indexOf?.('contract-trigger') < 0 &&
      target.className?.indexOf?.('expand-trigger') < 0
    ) {
      return;
    }

    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    const element = this;
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    resetTriggers(this);
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    if (this.__resizeRAF__) {
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      cancelFrame(this.__resizeRAF__);
    }
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    this.__resizeRAF__ = requestFrame(() => {
      if (checkTriggers(element)) {
        element.__resizeLast__.width = element.offsetWidth;
        element.__resizeLast__.height = element.offsetHeight;
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
        element.__resizeListeners__.forEach((fn) => {
          fn.call(element, e);
        });
      }
    });
  }

  /* Detect CSS Animations support to detect element display/re-attach */
  let animation = false;
  let keyframeprefix = '';
  let animationstartevent = 'animationstart';
  let pfx = '';

  const domPrefixes = 'Webkit Moz O ms'.split(' ');
  const startEvents =
    'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split(
      ' ',
    );

  const elm = document.createElement('fakeelement');
  if (elm.style.animationName !== undefined) {
    animation = true;
  }

  if (animation === false) {
    for (let i = 0; i < domPrefixes.length; i += 1) {
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
        pfx = domPrefixes[i];
        keyframeprefix = '-' + pfx.toLowerCase() + '-';
        animationstartevent = startEvents[i];
        animation = true;
        break;
      }
    }
  }

  const animationName = 'resizeanim';
  const animationKeyframes =
    '@' +
    keyframeprefix +
    'keyframes ' +
    animationName +
    ' { from { opacity: 0; } to { opacity: 0; } } ';
  const animationStyle =
    keyframeprefix + 'animation: 1ms ' + animationName + '; ';

  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  function createStyles(doc) {
    if (!doc.getElementById('detectElementResize')) {
      // opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
      const css =
        (animationKeyframes ?? '') +
        '.resize-triggers { ' +
        (animationStyle ?? '') +
        'visibility: hidden; opacity: 0; } ' +
        '.resize-triggers, .resize-triggers > div, .contract-trigger:before { ' +
        'content: " "; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; z-index: -1; }' +
        '.resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }';
      const head = doc.head || doc.getElementsByTagName('head')[0];
      const style = doc.createElement('style');

      style.id = 'detectElementResize';
      style.type = 'text/css';

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(doc.createTextNode(css));
      }

      head.appendChild(style);
    }
  }

  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  function addResizeListener(element, fn) {
    if (!element.__resizeTriggers__) {
      const doc = element.ownerDocument;
      const elementStyle = window.getComputedStyle(element);
      if (elementStyle && elementStyle.position === 'static') {
        element.style.position = 'relative';
      }
      createStyles(doc);
      element.__resizeLast__ = {};
      element.__resizeListeners__ = [];
      (element.__resizeTriggers__ = doc.createElement('div')).className =
        'resize-triggers';
      const expandTrigger = doc.createElement('div');
      expandTrigger.className = 'expand-trigger';
      expandTrigger.appendChild(doc.createElement('div'));
      const contractTrigger = doc.createElement('div');
      contractTrigger.className = 'contract-trigger';
      element.__resizeTriggers__.appendChild(expandTrigger);
      element.__resizeTriggers__.appendChild(contractTrigger);
      element.appendChild(element.__resizeTriggers__);
      resetTriggers(element);
      element.addEventListener('scroll', scrollListener, true);

      /* Listen for a css animation to detect element display/re-attach */
      if (animationstartevent) {
        element.__resizeTriggers__.__animationListener__ =
          // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
          function animationListener(e) {
            if (e.animationName === animationName) {
              resetTriggers(element);
            }
          };
        element.__resizeTriggers__.addEventListener(
          animationstartevent,
          element.__resizeTriggers__.__animationListener__,
        );
      }
    }
    element.__resizeListeners__.push(fn);
  }

  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  function removeResizeListener(element, fn) {
    element.__resizeListeners__.splice(
      element.__resizeListeners__.indexOf(fn),
      1,
    );
    if (!element.__resizeListeners__.length) {
      element.removeEventListener('scroll', scrollListener, true);
      if (element.__resizeTriggers__.__animationListener__) {
        element.__resizeTriggers__.removeEventListener(
          animationstartevent,
          element.__resizeTriggers__.__animationListener__,
        );
        element.__resizeTriggers__.__animationListener__ = null;
      }
      try {
        element.__resizeTriggers__ = !element.removeChild(
          element.__resizeTriggers__,
        );
      } catch (e) {
        // Preact compat; see developit/preact-compat/issues/228
      }
    }
  }

  return {
    addResizeListener,
    removeResizeListener,
  };
}
