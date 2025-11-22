export interface SheetVirtualRowsApi {
  scrollToTop: () => void;
  scrollToBottom: () => void;
  scrollToPosition: (vScrollOffset: number, hScrollOffset: number) => void;
  recalculateHeightsAfterIndex: (index: number) => void;
}
