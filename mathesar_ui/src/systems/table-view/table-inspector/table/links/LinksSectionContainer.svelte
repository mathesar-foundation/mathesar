<script lang="ts">
  import { Icon } from '@mathesar/component-library';
  import Button from '@mathesar/component-library/button/Button.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import LinkTableModal from '@mathesar/systems/table-view/link-table/LinkTableModal.svelte';
  import LinkSection from './LinkSection.svelte';
  import type { TableLink } from './utils';

  export let linksInThisTable: TableLink[];
  export let linksFromOtherTables: TableLink[];

  const linkTableModal = modal.spawnModalController();
</script>

<div class="links-section">
  {#if linksInThisTable.length}
    <LinkSection type="in_this_table" links={linksInThisTable} />
  {/if}
  {#if linksFromOtherTables.length}
    <LinkSection type="from_other_tables" links={linksFromOtherTables} />
  {/if}
  <div>
    <Button on:click={() => linkTableModal.open()} appearance="secondary">
      <Icon {...iconAddNew} />
      <span>Create Link</span>
    </Button>
    <LinkTableModal controller={linkTableModal} />
  </div>
</div>

<style lang="scss">
  .links-section {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }
</style>
