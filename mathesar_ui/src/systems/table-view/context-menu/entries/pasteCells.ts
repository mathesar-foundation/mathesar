import { type Writable, get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import {
  type PastingContext,
  paste,
} from '@mathesar/components/sheet/clipboard/paste';
import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
import { iconPaste } from '@mathesar/icons';
import { buttonMenuEntry } from '@mathesar-component-library';

export function* pasteCells(p: {
  selection: Writable<SheetSelection>;
  pastingContext?: PastingContext;
  showToastError: (msg: string) => void;
}) {
  const canPaste = get(p.selection).pasteOperation !== 'none';
  const hasPastingContext = !!p.pastingContext;

  if (!canPaste || !hasPastingContext) {
    yield buttonMenuEntry({
      icon: iconPaste,
      label: get(_)('paste'),
      disabled: true,
      onClick: () => {},
    });
    return;
  }

  async function handleClick() {
    if (!p.pastingContext) return;

    try {
      // Using the modern Clipboard API to read from the clipboard
      const clipboardItems = await navigator.clipboard.read();

      if (clipboardItems.length === 0) {
        p.showToastError('No clipboard data available');
        return;
      }

      // Get the first clipboard item
      const clipboardItem = clipboardItems[0];

      // Read the data as a DataTransfer-like object
      // We need to construct a DataTransfer object from the clipboard data
      const dataTransfer = new DataTransfer();

      // Try to get HTML first
      if (clipboardItem.types.includes('text/html')) {
        const blob = await clipboardItem.getType('text/html');
        const html = await blob.text();

        // Try to extract Mathesar structured data from HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const meta = doc.querySelector('meta[name="mathesar-clipboard"]');

        if (meta) {
          const encodedData = meta.getAttribute('content');
          if (encodedData) {
            const structuredData = decodeURIComponent(encodedData);
            dataTransfer.setData('application/x-vnd.mathesar-sheet-clipboard', structuredData);
          }
        }
      }

      // Always getting plain text as fallback
      if (clipboardItem.types.includes('text/plain')) {
        const blob = await clipboardItem.getType('text/plain');
        const text = await blob.text();
        dataTransfer.setData('text/plain', text);
      }

      await paste(dataTransfer, p.selection, p.pastingContext);
    } catch (e) {
      p.showToastError(
        e instanceof Error ? e.message : 'Failed to paste cells',
      );
    }
  }

  yield buttonMenuEntry({
    icon: iconPaste,
    label: get(_)('paste'),
    onClick: () => {
      void handleClick();
    },
  });
}
