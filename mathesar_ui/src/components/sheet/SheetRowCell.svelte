<script lang="ts">
  import { getSheetContext } from './utils';

  type SheetColumnIdentifierKey = $$Generic;

  const { stores } = getSheetContext();
  const { columnStyleMap } = stores;

  export let columnIdentifierKey: SheetColumnIdentifierKey;

  $: style = $columnStyleMap.get(columnIdentifierKey);

  export let isStatic = false;
  export let isControlCell = false;

  $: htmlAttributes = {
    'data-sheet-element': 'cell',
    'data-sheet-section': 'rows',
    'data-cell-type': isControlCell ? 'control' : 'normal',
    'data-cell-static': isStatic,
  };
</script>

<slot {htmlAttributes} {style} />
