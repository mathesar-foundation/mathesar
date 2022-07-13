<script lang="ts">
  import { getSheetContext } from './utils';

  type SheetColumnIdentifierKey = $$Generic;

  const { stores } = getSheetContext();
  const { columnStyleMap } = stores;

  export let columnIdentifierKey: SheetColumnIdentifierKey;

  $: style = $columnStyleMap.get(columnIdentifierKey);

  export let isStatic = false;

  $: htmlAttributes = {
    'data-sheet-element': 'cell',
    'data-cell-static': isStatic ? true : undefined,
  };
</script>

<slot {htmlAttributes} {style} />
