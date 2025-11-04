import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import {
  type CopyingContext,
  getCopyContent,
} from '@mathesar/components/sheet/clipboard/copy';
import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
import { iconCopyMajor } from '@mathesar/icons';
import { buttonMenuEntry } from '@mathesar-component-library';

export function* copyCells(p: {
  selection: SheetSelection;
  copyingContext: CopyingContext;
  showToastInfo: (msg: string) => void;
  showToastError: (msg: string) => void;
}) {
  async function handleClick() {
    try {
      const content = getCopyContent(p.selection, p.copyingContext);

      // Using the modern Clipboard API to write to the clipboard
      // Note: Most browsers only support standard MIME types (text/plain, text/html)
      // We'll use text/html to carry our structured data as a data attribute
      const htmlContent = `<meta name="mathesar-clipboard" content="${encodeURIComponent(
        content.structured,
      )}"/>${content.tsv}`;

      const clipboardItems = [
        new ClipboardItem({
          'text/plain': new Blob([content.tsv], {
            type: 'text/plain',
          }),
          'text/html': new Blob([htmlContent], {
            type: 'text/html',
          }),
        }),
      ];

      await navigator.clipboard.write(clipboardItems);

      p.showToastInfo(
        get(_)('copied_cells', { values: { count: content.cellCount } }),
      );
    } catch (e) {
      p.showToastError(e instanceof Error ? e.message : 'Failed to copy cells');
    }
  }

  yield buttonMenuEntry({
    icon: iconCopyMajor,
    label: get(_)('copy'),
    onClick: () => {
      void handleClick();
    },
  });
}
