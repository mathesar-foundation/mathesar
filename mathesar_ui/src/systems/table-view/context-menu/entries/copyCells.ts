import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { SheetClipboardHandler } from '@mathesar/components/sheet/clipboard';
import { iconCopyMajor } from '@mathesar/icons';
import { buttonMenuEntry } from '@mathesar-component-library';

export function* copyCells(p: { clipboardHandler: SheetClipboardHandler }) {
  yield buttonMenuEntry({
    icon: iconCopyMajor,
    label: get(_)('copy'),
    onClick: () => {
      void p.clipboardHandler.copy();
    },
  });
}
