import { writable } from 'svelte/store';
import type { Readable, Subscriber, Unsubscriber } from 'svelte/store';

/**
 * AccompanyingElements stores references to any DOM nodes which "accompany" a
 * Dropdown -- even when those nodes are not nested within the Dropdown's
 * content. We store these references so that we're able to keep the Dropdown
 * open when the user clicks on an accompanying element. The use case is
 * primarily (but not necessarily limited to) nested Dropdown components.
 *
 * Since Dropdown components can be nested to an arbitrary degree, we also
 * store a reference to the AccompanyingElements object for the parent
 * Dropdown component (if applicable). This allows us to forward changes up to
 * the parent so that deeply nested Dropdown components can inform all their
 * ancestors of their content.
 *
 * Why is this class Readable instead of Writable? Because we need to forward
 * specific _changes_, up to the parent AccompanyingElements object. The `add`
 * and `delete` methods allow us to do that, but a `set` method would not
 * because it wouldn't be clear whether we're adding or removing or both.
 */
export class AccompanyingElements implements Readable<Set<HTMLElement>> {
  elements = writable(new Set<HTMLElement>());

  parent: AccompanyingElements | undefined;

  constructor(parent?: AccompanyingElements) {
    this.parent = parent;
  }

  /**
   * @returns a function to remove the element, which should be called to avoid
   * memory leaks
   */
  add(el: HTMLElement): () => void {
    this.elements.update((elements) => {
      const s = new Set(elements);
      s.add(el);
      return s;
    });
    this.parent?.add(el);
    return () => this.delete(el);
  }

  delete(el: HTMLElement): void {
    this.elements.update((elements) => {
      const s = new Set(elements);
      s.delete(el);
      return s;
    });
    this.parent?.delete(el);
  }

  subscribe(subscription: Subscriber<Set<HTMLElement>>): Unsubscriber {
    return this.elements.subscribe(subscription);
  }
}
