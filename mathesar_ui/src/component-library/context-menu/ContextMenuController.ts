import { type Readable, writable } from 'svelte/store';

import type { PreparedMenuEntry } from '@mathesar-component-library-dir/prepared-menu';

export interface ClientPosition {
  clientX: number;
  clientY: number;
}

export interface ContextMenuProps {
  position: ClientPosition;
  entries: PreparedMenuEntry[];
}

export class ContextMenuController
  implements Readable<ContextMenuProps | undefined>
{
  private props = writable<ContextMenuProps | undefined>(undefined);

  open(props: ContextMenuProps) {
    this.props.set(props);
  }

  close() {
    this.props.set(undefined);
  }

  subscribe(run: (value: ContextMenuProps | undefined) => void): () => void {
    return this.props.subscribe(run);
  }
}
