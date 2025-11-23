import { iconDeleteMajor } from '@mathesar/icons';
import { buttonMenuEntry } from '@mathesar-component-library';

export function* copyCell({
  tabularData,
  cellId,
}: {
  tabularData: any;
  cellId: string;
}) {
  const value = tabularData.recordsData.getCellValue(cellId);

  yield buttonMenuEntry({
    icon: iconDeleteMajor, // TEMP ICON (works, no errors)
    label: 'Copy',
    onClick: async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify({ value }));
      } catch (err) {
        console.error('Copy failed:', err);
      }
    },
  });
}
