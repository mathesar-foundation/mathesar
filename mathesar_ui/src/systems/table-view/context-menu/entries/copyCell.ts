import { iconCopyMajor } from '@mathesar/icons';
import { buttonMenuEntry } from '@mathesar-component-library';
import type { TabularData } from '@mathesar/stores/table-data';

export function* copyCell({
  tabularData,
  cellId,
}: {
  tabularData: TabularData;
  cellId: string;
}) {
  const value = tabularData.recordsData.getCellValue(cellId);

  yield buttonMenuEntry({
    icon: iconCopyMajor,
    label: 'Copy',
    onClick: () => {
      // NOT async → fixes @typescript-eslint/no-misused-promises
      void navigator.clipboard.writeText(JSON.stringify({ value }));
    },
  });
}
