import ImmutableSet from '@mathesar-component-library-dir/common/utils/ImmutableSet';

type ModalId = number | string;

/**
 * Stores the IDs of all currently opened modals in an ImmutableSet. Note that
 * ImmutableSet is a wrapper around the native Set object which preserves the
 * insertion order of items in the set.
 *
 * The first id in the set is for the highest modal. The last id in the set is
 * for the lowest modal.
 */
export default class ModalStack {
  private idSet: ImmutableSet<ModalId>;

  constructor(ids?: Iterable<ModalId>) {
    this.idSet = new ImmutableSet(ids);
  }

  /**
   * The first id represents the modal on top (with the highest stacking order).
   */
  ids(): IterableIterator<ModalId> {
    return this.idSet.values();
  }

  get size(): number {
    return this.idSet.size;
  }

  has(id: ModalId): boolean {
    return this.idSet.has(id);
  }

  isOnTop(id: ModalId): boolean {
    return this.idSet.values().next().value === id;
  }

  /**
   * Returns a new ModalStack with the given id on top (listed first).
   */
  withModalOnTop(id: ModalId): ModalStack {
    return new ModalStack(new ImmutableSet([id]).union(this.idSet).values());
  }

  without(id: ModalId): ModalStack {
    return new ModalStack(this.idSet.without(id).values());
  }
}
