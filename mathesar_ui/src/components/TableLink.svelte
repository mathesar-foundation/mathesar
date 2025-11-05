<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { Table } from '@mathesar/models/Table';
  import { getTablePageUrl } from '@mathesar/routes/urls';
  import { Icon, iconExternalLink } from '@mathesar-component-library';

  import TableName from './TableName.svelte';

  interface $$Props extends ComponentProps<TableName> {
    table: Table;
    boxed?: boolean;
  }

  export let table: Table;
  export let boxed = false;
  export let showIcon = true;

  $: tablePageUrl = getTablePageUrl(
    table.schema.database.id,
    table.schema.oid,
    table.oid,
  );
</script>

<a class="table-link" class:boxed href={tablePageUrl}>
  <TableName {table} {...$$restProps} />
  {#if showIcon}
    <Icon {...iconExternalLink} />
  {/if}
</a>

<style lang="scss">
  .table-link {
    display: inline-flex;
    align-items: center;
    gap: var(--sm5);
    text-decoration: none;
    max-width: 100%;
    color: var(--color-link, var(--color-fg));
    cursor: pointer;

    &:hover,
    &:active {
      /* Use the yellow used by the table icon where available */
      color: var(--color-table, var(--entity-name-color, var(--color-record)));
      text-decoration: underline;
    }

    &:focus-visible {
      outline: 3px solid
        color-mix(
          in srgb,
          var(--color-table, var(--entity-name-color, var(--color-record))) 30%,
          transparent
        );
      outline-offset: 2px;
    }

    &.boxed {
      border-radius: var(--border-radius-xl);
      border: 1px solid var(--color-border-token);
      background-color: var(--color-bg-token);
      padding: var(--sm6) var(--sm3);
      font-size: var(--TableLink__boxed-font-size, var(--sm1));
      font-weight: var(--font-weight-bold);
    }
  }
</style>
