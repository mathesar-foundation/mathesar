<script lang="ts">
  import type { TableEntry } from '@mathesar/api/types/tables';
  import { Icon, Truncate } from '@mathesar-component-library';
  import { iconTable } from '@mathesar/icons';

  export let table: Pick<TableEntry, 'name' | 'description'>;
</script>

<div class="table-name-and-description">
  <div class="icon">
    <Icon {...iconTable} class="block" />
  </div>
  <div class="text">
    <div class="name" title={table.name}>
      <Truncate>{table.name}</Truncate>
    </div>
    {#if table.description}
      <div class="description">
        <Truncate>{table.description}</Truncate>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .table-name-and-description {
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  .icon {
    font-size: 1.5rem;
    padding: 0.3em;
    background: var(--yellow-200);
    border-radius: 0.2em;
    margin-right: 0.5rem;
  }
  .text {
    overflow: hidden;
  }
  .name {
    overflow: hidden;
  }
  .description {
    font-size: smaller;
    color: var(--color-text-muted);
    overflow: hidden;
  }
</style>
