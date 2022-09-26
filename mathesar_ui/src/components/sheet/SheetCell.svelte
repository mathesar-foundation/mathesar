<script lang="ts">
  import { getSheetContext } from './utils';

  type SheetColumnIdentifierKey = $$Generic;

  const { stores } = getSheetContext();
  const { columnStyleMap } = stores;

  export let columnIdentifierKey: SheetColumnIdentifierKey;

  $: styleMap = $columnStyleMap.get(columnIdentifierKey);

  export let isStatic = false;
  export let isControlCell = false;

  $: htmlAttributes = {
    'data-sheet-element': 'cell',
    'data-cell-static': isStatic ? true : undefined,
    'data-cell-control': isControlCell ? true : undefined,
  };
</script>

<slot {htmlAttributes} style={styleMap?.styleString} />
