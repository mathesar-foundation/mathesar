<script lang="ts">
  import { Button, Icon } from '@mathesar/component-library';
  import {
    iconLinksFromOtherTables,
    iconLinksInThisTable,
  } from '@mathesar/icons';
  import { MissingExhaustiveConditionError } from '@mathesar/utils/errors';
  import { modal } from '@mathesar/stores/modal';
  import LinkTableModal from '@mathesar/systems/table-view/link-table/LinkTableModal.svelte';
  import type { TableLink, TableLinkType } from './utils';
  import LinkItem from './LinkItem.svelte';

  export let links: TableLink[];
  export let type: TableLinkType;
  export let showCreateLinkButton = false;

  const linkTableModal = modal.spawnModalController();

  $: icon = (function () {
    switch (type) {
      case 'in_this_table':
        return iconLinksInThisTable;
      case 'from_other_tables':
        return iconLinksFromOtherTables;
      default:
        throw new MissingExhaustiveConditionError(type);
    }
  }());

  $: title = (function () {
    switch (type) {
      case 'in_this_table':
        return 'In this table';
      case 'from_other_tables':
        return 'From other tables';
      default:
        throw new MissingExhaustiveConditionError(type);
    }
  }());
</script>

<div class="link-section-container">
  <div class="header">
    <div class="left">
      <Icon {...icon} />
      <span>{title}</span>
    </div>
    {#if showCreateLinkButton}
      <div class="right">
        <Button
          appearance="plain"
          class="padding-zero"
          on:click={() => linkTableModal.open()}
        >
          Create Link
        </Button>
        <LinkTableModal controller={linkTableModal} />
      </div>
    {/if}
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
