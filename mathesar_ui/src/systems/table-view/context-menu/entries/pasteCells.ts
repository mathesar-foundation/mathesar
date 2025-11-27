import { type Writable, get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { SheetClipboardHandler } from '@mathesar/components/sheet/clipboard/SheetClipboardHandler';
import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
import { iconPaste } from '@mathesar/icons';
import { buttonMenuEntry } from '@mathesar-component-library';

export function* pasteCells(p: {
  selection: Writable<SheetSelection>;
  clipboardHandler: SheetClipboardHandler;
}) {
  const canPaste = get(p.selection).pasteOperation !== 'none';

  if (!canPaste) {
    yield buttonMenuEntry({
      icon: iconPaste,
      label: get(_)('paste'),
      disabled: true,
      onClick: () => {},
    });
    return;
  }

  yield buttonMenuEntry({
    icon: iconPaste,
    label: get(_)('paste'),
    onClick: () => {
      void p.clipboardHandler.paste();
    },
  });
}
