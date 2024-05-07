<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconAddNew } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import LinkTableModal from '@mathesar/systems/table-view/link-table/LinkTableModal.svelte';
  import { Button, Icon } from '@mathesar-component-library';

  import LinkSection from './LinkSection.svelte';
  import type { TableLink } from './utils';

  export let linksInThisTable: TableLink[];
  export let linksFromOtherTables: TableLink[];
  export let canExecuteDDL: boolean;

  const linkTableModal = modal.spawnModalController();
  $: showNullState = !linksInThisTable.length && !linksFromOtherTables.length;
</script>

<div class="links-section">
  {#if linksInThisTable.length}
    <LinkSection type="in_this_table" links={linksInThisTable} />
  {/if}
  {#if linksFromOtherTables.length}
    <LinkSection type="from_other_tables" links={linksFromOtherTables} />
  {/if}
  {#if showNullState}
    <span class="null-text">{$_('table_does_not_link')}</span>
  {/if}
  {#if canExecuteDDL}
    <div>
      <Button on:click={() => linkTableModal.open()} appearance="secondary">
        <Icon {...iconAddNew} />
        <span>{$_('create_link')}</span>
      </Button>
      <LinkTableModal controller={linkTableModal} />
    </div>
  {/if}
</div>

<style lang="scss">
  .links-section {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }
  .null-text {
    color: var(--color-text-muted);
  }
</style>
