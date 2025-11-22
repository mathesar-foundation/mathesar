import { buttonMenuEntry } from '@mathesar-component-library';
import { iconPaste } from '@mathesar/icons';
import { parseCellId } from '@mathesar/components/sheet/cellIds';

export function* pasteCell({
  tabularData,
  cellId,
}: {
  tabularData: any;
  cellId: string;
}) {
  const { rowId, columnId } = parseCellId(cellId);

  yield buttonMenuEntry({
    icon: iconPaste,
    label: 'Paste',
    onClick: async () => {
      try {
        const text = await navigator.clipboard.readText();
        const parsed = JSON.parse(text);

        const newValue =
          typeof parsed === "object" && parsed !== null && "value" in parsed
            ? parsed.value
            : text;

        const row = tabularData.recordsData.selectableRowsMap.get(rowId);
        if (!row) {
          console.error("Row not found", rowId);
          return;
        }

        await tabularData.recordsData.bulkUpdate([
          {
            row,
            cells: [{ columnId, value: newValue }],
          },
        ]);
      } catch (e) {
        console.error("Paste failed:", e);
      }
    },
  });
}
