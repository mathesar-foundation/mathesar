import { HIGHLIGHT_TRANSITION_MS, HINT_EXPIRATION_END_MS } from './constants';
import { displayHint } from './hint';
import { getRectCssGeometry, onElementRemoved } from './utils';

function makeHighlighterElement(): HTMLElement {
  const effect = document.createElement('div');
  effect.className = 'effect';

  const highlight = document.createElement('div');
  highlight.className = 'new-item-highlighter';
  highlight.appendChild(effect);

  return highlight;
}

function displayHighlight(target: HTMLElement): void {
  const highlight = makeHighlighterElement();
  highlight.style.setProperty('--duration', `${HIGHLIGHT_TRANSITION_MS}ms`);
  document.body.appendChild(highlight);

  // While the highlight is in effect, we use a requestAnimationFrame loop to
  // track the target's position and update the highlight's position
  // accordingly.
  function trackPosition() {
    if (!target.isConnected) return;
    const rect = target.getBoundingClientRect();
    Object.assign(highlight.style, getRectCssGeometry(rect));
    requestAnimationFrame(trackPosition);
  }
  trackPosition();

  function cleanup() {
    highlight.remove();
  }

  onElementRemoved(target, cleanup);
  setTimeout(cleanup, HIGHLIGHT_TRANSITION_MS);
}

export function setupHighlighter(
  target: HTMLElement,
  options: {
    scrollHint?: string;
  },
): () => void {
  let cleanupHint: (() => void) | undefined;

  // Use an IntersectionObserver to detect when the target is in view. When it
  // is, display the highlight. If it's not, then display the scroll hint.
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        displayHighlight(target);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        cleanup();
      } else if (options.scrollHint && !cleanupHint) {
        cleanupHint = displayHint(target, options.scrollHint);
      }
    },
    { threshold: [0.5] },
  );

  function cleanup() {
    intersectionObserver.disconnect();
    cleanupHint?.();
  }

  intersectionObserver.observe(target);

  onElementRemoved(target, cleanup);

  // If the user still hasn't seen the hint or the highlight (i.e. if it's
  // scrolled out of view), then we give up and remove them. This means
  // `displayHighlight` will never be called.
  setTimeout(cleanup, HINT_EXPIRATION_END_MS);

  return cleanup;
}
