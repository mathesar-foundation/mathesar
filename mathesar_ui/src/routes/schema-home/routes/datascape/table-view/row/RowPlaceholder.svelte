<script lang="ts">
  import { ROW_CONTROL_COLUMN_WIDTH } from '@mathesar/stores/table-data';

  export let rowWidth: number;
</script>

<div
  class="cell row-control new-row-help-cell"
  style="width:{ROW_CONTROL_COLUMN_WIDTH}px;left:0px"
  on:click
/>

<div
  class="cell new-row-help-cell"
  on:click
  style="left:{ROW_CONTROL_COLUMN_WIDTH}px;
    width:{rowWidth - ROW_CONTROL_COLUMN_WIDTH}px;
    min-width:400px"
>
  New records will be repositioned on refresh
</div>
