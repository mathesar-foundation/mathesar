<script lang="ts">
  import { Collapsible } from '@mathesar-component-library';
  import type { ColumnWithLink } from '../InputColumnsManager';
  import SelectableColumn from './SelectableColumn.svelte';

  export let columnsWithLinks: Map<ColumnWithLink['id'], ColumnWithLink>;
</script>

{#each [...columnsWithLinks] as [columnId, column] (columnId)}
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
