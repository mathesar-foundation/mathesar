import { type Writable, get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { ClipboardHandler } from '@mathesar/stores/clipboard';
import { getErrorMessage } from '@mathesar/utils/errors';

import type SheetSelection from '../selection/SheetSelection';

import { MIME_PLAIN_TEXT } from './constants';
import { type CopyingContext, getCopyContent } from './copy';
import { type PastingContext, paste } from './paste';

interface Dependencies {
  selection: Writable<SheetSelection>;
  copyingContext: CopyingContext;
  pastingContext?: PastingContext;
  showToastInfo: (msg: string) => void;
  showToastError: (msg: string) => void;
}

function shouldHandleEvent(): boolean {
  // Only handle clipboard events when a cell is focused. This prevents pasting
  // into inputs while editing cells, and other unexpected behavior.
  return document.activeElement?.hasAttribute('data-active-cell') ?? false;
}

/**
 * Convert TSV data to an HTML table with embedded structured data.
 *
 * This creates a proper HTML table for compatibility with spreadsheet
 * and document applications, while embedding Mathesar's structured data
 * in a data attribute for internal paste operations.
 *
 * @param tsv - Tab-separated values
 * @param structuredData - JSON-encoded structured cell data
 */
function tsvToHtmlTable(tsv: string, structuredData: string): string {
  const rows = tsv.split('\n').filter((row) => row.length > 0);
  const tableRows = rows
    .map((row) => {
      const cells = row
        .split('\t')
        .map((cell) => `<td>${cell}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<html><head></head><body><table data-mathesar-content="${encodeURIComponent(
    structuredData,
  )}"><tbody>${tableRows}</tbody></table></body></html>`;
}

export class SheetClipboardHandler implements ClipboardHandler {
  private readonly deps: Dependencies;

  constructor(deps: Dependencies) {
    this.deps = deps;
  }

  shouldHandleCopy() {
    return shouldHandleEvent();
  }

  shouldHandlePaste() {
    return shouldHandleEvent();
  }

  handleCopy(event: ClipboardEvent): void {
    if (event.clipboardData == null) return;
    try {
      const selection = get(this.deps.selection);
      const content = getCopyContent(selection, this.deps.copyingContext);
      this.deps.showToastInfo(
        get(_)('copied_cells', { values: { count: content.cellCount } }),
      );

      event.clipboardData.setData(MIME_PLAIN_TEXT, content.tsv);
      const htmlContent = tsvToHtmlTable(content.tsv, content.structured);
      event.clipboardData.setData('text/html', htmlContent);
    } catch (e) {
      this.deps.showToastError(getErrorMessage(e));
    }
  }

  async handlePaste({ clipboardData }: ClipboardEvent) {
    const context = this.deps.pastingContext;
    if (!context) return;
    if (!clipboardData) return;
    try {
      await paste(clipboardData, this.deps.selection, context);
    } catch (e) {
      this.deps.showToastError(getErrorMessage(e));
    }
  }

  /**
   * Imperative copy method for use in context menus and other UI actions.
   * Uses the modern Clipboard API to write to the clipboard.
   */
  async copy(): Promise<void> {
    try {
      const selection = get(this.deps.selection);
      const content = getCopyContent(selection, this.deps.copyingContext);
      const htmlContent = tsvToHtmlTable(content.tsv, content.structured);

      const clipboardItems = [
        new ClipboardItem({
          [MIME_PLAIN_TEXT]: new Blob([content.tsv], {
            type: MIME_PLAIN_TEXT,
          }),
          'text/html': new Blob([htmlContent], {
            type: 'text/html',
          }),
        }),
      ];

      await navigator.clipboard.write(clipboardItems);

      this.deps.showToastInfo(
        get(_)('copied_cells', { values: { count: content.cellCount } }),
      );
    } catch (e) {
      this.deps.showToastError(getErrorMessage(e));
    }
  }

  /**
   * Imperative paste method for use in context menus and other UI actions.
   * Uses the modern Clipboard API to read from the clipboard.
   */
  async paste(): Promise<void> {
    const context = this.deps.pastingContext;
    if (!context) return;

    try {
      const clipboardItems = await navigator.clipboard.read();
      const item = clipboardItems[0];
      if (!item) return;

      let htmlText = '';
      if (item.types.includes('text/html')) {
        const htmlBlob = await item.getType('text/html');
        htmlText = await htmlBlob.text();
      }

      let plainText = '';
      if (item.types.includes(MIME_PLAIN_TEXT)) {
        const textBlob = await item.getType(MIME_PLAIN_TEXT);
        plainText = await textBlob.text();
      }

      const dataTransfer = new DataTransfer();
      if (htmlText) {
        dataTransfer.setData('text/html', htmlText);
      }
      dataTransfer.setData(MIME_PLAIN_TEXT, plainText);

      await paste(dataTransfer, this.deps.selection, context);
    } catch (e) {
      this.deps.showToastError(getErrorMessage(e));
    }
  }
}
