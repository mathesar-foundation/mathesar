<script lang="ts">
  import {
    faPlus,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon } from '@mathesar-components';
  import {
    ROW_CONTROL_COLUMN_WIDTH,
  } from '@mathesar/stores/table-data';

  export let rowWidth: number;
</script>

<div class="cell row-control" style="width:{ROW_CONTROL_COLUMN_WIDTH}px;left:0px" on:click>
  <Icon data={faPlus}/>
</div>

<div class="cell" on:click
  style="left:{ROW_CONTROL_COLUMN_WIDTH}px;width:{rowWidth - ROW_CONTROL_COLUMN_WIDTH}px;">
</div>
