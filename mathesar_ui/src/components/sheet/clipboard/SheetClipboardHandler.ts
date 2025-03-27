import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { ClipboardHandler } from '@mathesar/stores/clipboard';
import { getErrorMessage } from '@mathesar/utils/errors';

import type SheetSelection from '../selection/SheetSelection';

import { MIME_MATHESAR_SHEET_CLIPBOARD, MIME_PLAIN_TEXT } from './constants';
import { type CopyingContext, getCopyContent } from './copy';
import { type PastingContext, paste } from './paste';

interface Dependencies {
  getSelection: () => SheetSelection;
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
      const selection = this.deps.getSelection();
      const content = getCopyContent(selection, this.deps.copyingContext);
      this.deps.showToastInfo(
        get(_)('copied_cells', { values: { count: content.cellCount } }),
      );
      event.clipboardData.setData(MIME_PLAIN_TEXT, content.tsv);
      event.clipboardData.setData(
        MIME_MATHESAR_SHEET_CLIPBOARD,
        content.structured,
      );
    } catch (e) {
      this.deps.showToastError(getErrorMessage(e));
    }
  }

  async handlePaste({ clipboardData }: ClipboardEvent) {
    const context = this.deps.pastingContext;
    if (!context) return;
    const selection = this.deps.getSelection();
    if (!clipboardData) return;
    try {
      await paste(clipboardData, selection, context);
    } catch (e) {
      this.deps.showToastError(getErrorMessage(e));
    }
  }
}
