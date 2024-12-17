import {
  HINT_EXPIRATION_START_MS,
  HINT_EXPIRATION_TRANSITION_MS,
} from './constants';
import {
  getNearestVerticallyScrollableAncestor,
  onElementRemoved,
} from './utils';

function makeArrowElement(): SVGSVGElement {
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrow.setAttribute('viewBox', '0 0 400 400');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'm 358,179.5 c 3.8,-8.8 2,-19 -4.6,-26 L 217.4,9.5 C 212.9,4.7 206.6,2 200,2 193.4,2 187.1,4.7 182.6,9.5 l -136,144 c -6.6,7 -8.4,17.2 -4.6,26 3.8,8.8 12.4,14.5 22,14.5 h 72 V 400 H 264 V 194 h 72 c 9.6,0 18.2,-5.7 22,-14.5 z',
  );
  arrow.appendChild(path);
  return arrow;
}

function makeHintElement(
  message: string,
  direction: 'up' | 'down',
): HTMLElement {
  const hintElement = document.createElement('div');
  hintElement.classList.add('new-item-highlighter__hint', direction);
  hintElement.style.setProperty(
    'transition',
    `opacity ${HINT_EXPIRATION_TRANSITION_MS}ms ${HINT_EXPIRATION_START_MS}ms`,
  );
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageElement.className = 'message';
  hintElement.appendChild(makeArrowElement());
  hintElement.appendChild(messageElement);
  return hintElement;
}

export function displayHint(target: HTMLElement, message: string): () => void {
  const container = getNearestVerticallyScrollableAncestor(target);
  if (!container) return () => {};

  const containerTop = container.getBoundingClientRect().top;
  const targetTop = target.getBoundingClientRect().top;
  const direction = targetTop > containerTop ? 'down' : 'up';

  const hintElement = makeHintElement(message, direction);
  document.body.appendChild(hintElement);
  const hintRect = hintElement.getBoundingClientRect();

  function positionHint() {
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const top =
      direction === 'up'
        ? containerRect.top
        : containerRect.bottom - hintRect.height;
    const left =
      containerRect.left + (containerRect.width - hintRect.width) / 2;
    hintElement.style.top = `${top}px`;
    hintElement.style.left = `${left}px`;
  }

  const resizeObserver = new ResizeObserver(positionHint);
  resizeObserver.observe(container);
  resizeObserver.observe(document.body);

  function scrollContainerToTarget() {
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const top =
      direction === 'up'
        ? targetRect.top - containerRect.top
        : targetRect.bottom - containerRect.bottom;
    container.scrollTo({
      top,
      behavior: 'smooth',
    });
  }

  hintElement.addEventListener('click', scrollContainerToTarget);

  function cleanup() {
    hintElement.remove();
    resizeObserver.disconnect();
    document.body.removeEventListener('click', cleanup);
  }

  onElementRemoved(target, cleanup);
  onElementRemoved(container, cleanup);
  setTimeout(() => document.body.addEventListener('click', cleanup), 50);

  return cleanup;
}
