<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    iconLinksFromOtherTables,
    iconLinksInThisTable,
  } from '@mathesar/icons';
  import { Icon, assertExhaustive } from '@mathesar-component-library';

  import LinkItem from './LinkItem.svelte';
  import type { TableLink, TableLinkType } from './utils';

  export let links: TableLink[];
  export let type: TableLinkType;

  $: icon = (() => {
    switch (type) {
      case 'in_this_table':
        return iconLinksInThisTable;
      case 'from_other_tables':
        return iconLinksFromOtherTables;
      default:
        return assertExhaustive(type);
    }
  })();

  $: title = (() => {
    switch (type) {
      case 'in_this_table':
        return $_('in_this_table');
      case 'from_other_tables':
        return $_('from_other_tables');
      default:
        return assertExhaustive(type);
    }
  })();
</script>

<div class="link-section-container">
  <div class="header">
    <div class="left">
      <Icon {...icon} />
      <span>{title}</span>
    </div>
  </div>
  <div class="links">
    {#each links as link}
      <LinkItem {link} />
    {/each}
  </div>
</div>

<style lang="scss">
  .link-section-container {
    .header {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;

      > :global(* + *) {
        margin-left: 0.25rem;
      }

      .left {
        display: flex;
        flex-direction: row;
        align-items: center;

        > :global(* + *) {
          margin-left: 0.25rem;
        }
      }
    }

    .links {
      display: flex;
      flex-direction: column;

      > :global(* + *) {
        margin-top: 0.75rem;
      }
    }
  }
</style>
