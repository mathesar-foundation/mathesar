<script lang="ts">
  import { Collapsible } from '@mathesar-component-library';
  import type { ColumnWithLink } from './selectionPaneUtils';
  import SelectableColumn from './SelectableColumn.svelte';

  export let columnsWithLinks: ColumnWithLink[];
</script>

{#each columnsWithLinks as column (column.id)}
  {#if column.linksTo}
    <Collapsible>
      <div slot="header" class="column-name">
        <div>{column.name}</div>
        <div>
          -> {column.linksTo?.name}.{column.linksTo?.linkedToColumn.name}
        </div>
      </div>
      <div class="column-list" slot="content">
        <svelte:self columnsWithLinks={column.linksTo.columns} on:add />
      </div>
    </Collapsible>
  {:else}
    <SelectableColumn {column} on:add />
  {/if}
{/each}
