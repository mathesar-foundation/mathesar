import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { ClipboardHandler } from '@mathesar/stores/clipboard';

import type SheetSelection from '../selection/SheetSelection';

import { MIME_MATHESAR_SHEET_CLIPBOARD, MIME_PLAIN_TEXT } from './constants';
import { type CopyingContext, getCopyContent } from './copy';
import { type PastingContext, getPayload, paste } from './paste';

interface Dependencies {
  getSelection: () => SheetSelection;
  getCopyingContext: () => CopyingContext;
  getPastingContext?: () => PastingContext;
  showToastInfo: (msg: string) => void;
  showToastError: (msg: string) => void;
}

export class SheetClipboardHandler implements ClipboardHandler {
  private readonly deps: Dependencies;

  constructor(deps: Dependencies) {
    this.deps = deps;
  }

  handleCopy(event: ClipboardEvent): void {
    if (event.clipboardData == null) return;
    const selection = this.deps.getSelection();
    const context = this.deps.getCopyingContext();
    const content = getCopyContent(selection, context);
    this.deps.showToastInfo(
      get(_)('copied_cells', { values: { count: content.cellCount } }),
    );
    event.clipboardData.setData(MIME_PLAIN_TEXT, content.tsv);
    event.clipboardData.setData(
      MIME_MATHESAR_SHEET_CLIPBOARD,
      content.structured,
    );
  }

  handlePaste({ clipboardData }: ClipboardEvent) {
    if (clipboardData == null) return;
    const context = this.deps.getPastingContext?.();
    if (!context) return;
    const payload = getPayload(clipboardData);
    if (!payload) return;
    const selection = this.deps.getSelection();
    paste(payload, selection, context);
  }
}
