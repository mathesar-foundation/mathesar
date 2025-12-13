<script lang="ts">
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import {
    type ProcessedColumn,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import {
    BadgeCount,
    ButtonMenuItem,
    Dropdown,
    Icon,
    Menu,
  } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ processedColumns } = $tabularData);

  export let icon: IconProps;
  export let label: string;
  export let addColumnToOperation: (pc: ProcessedColumn) => unknown;

  export let badgeCount = 0;
  export let applied = false;
  export let isOpen = false;
</script>

<Dropdown
  bind:isOpen
  showArrow={false}
  triggerAppearance="secondary"
  {...$$restProps}
  ariaLabel={label}
>
  <svelte:fragment slot="trigger">
    <Icon {...icon} />
    <span class="responsive-button-label with-badge">
      {label}
      {#if badgeCount > 0}
        <BadgeCount value={badgeCount} />
      {/if}
    </span>
  </svelte:fragment>
  <svelte:fragment slot="content" let:close>
    {#if applied}
      <slot />
    {:else}
      <div class="columns">
        <Menu modal={{ close, closeRoot: close }}>
          {#each [...$processedColumns.values()] as column (column.id)}
            <ButtonMenuItem on:click={() => addColumnToOperation(column)}>
              <ProcessedColumnName processedColumn={column} />
            </ButtonMenuItem>
          {/each}
        </Menu>
      </div>
    {/if}
  </svelte:fragment>
</Dropdown>

<style lang="scss">
  .with-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--sm5);
  }
  .columns {
    min-width: 10rem;
    --Menu__min-width: 100%;
  }
</style>
