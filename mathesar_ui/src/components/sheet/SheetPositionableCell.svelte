<script lang="ts">
  import { getSheetContext } from './utils';
  import type { ColumnPosition } from './utils';

  const { stores } = getSheetContext();
  const { columnStyleMap } = stores;

  export let index: number;
  export let columnSpan = 1;

  function calculateStyle(
    _columnStyleMap: Map<unknown, ColumnPosition>,
    _index: number,
    _columnSpan: number,
  ): string {
    const columnStyleValues = [..._columnStyleMap.values()];
    const startIndex = columnStyleValues[index] ? index : 0;
    const left = columnStyleValues[startIndex]?.left ?? 0;

    let endEntry = columnStyleValues[startIndex + _columnSpan - 1];
    endEntry = endEntry ?? columnStyleValues[columnStyleValues.length - 1];
    const width = endEntry ? endEntry.left + endEntry.width - left : 0;

    return `left: ${left}px; width: ${width}px`;
  }

  $: style = calculateStyle($columnStyleMap, index, columnSpan);

  export let isStatic = false;

  $: htmlAttributes = {
    'data-sheet-element': 'cell',
    'data-cell-static': isStatic ? true : undefined,
  };
</script>

<slot {htmlAttributes} {style} />
