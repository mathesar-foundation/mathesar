<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import { iconTable } from '@mathesar/icons';
  import NameWithIcon from './NameWithIcon.svelte';

  export let table: Pick<TableEntry, 'name' | 'description'>;
</script>

<NameWithIcon icon={iconTable}>
  <div class="name-and-description">
    <span class="name" title={table.name}>{table.name}</span>
    {#if table.description}
      <span class="description" title={table.description}>
        {table.description}
      </span>
    {/if}
  </div>
</NameWithIcon>

<style lang="scss">
  .name-and-description {
    .name {
      font-weight: bolder;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .description {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: smaller;
    }
  }
</style>
