<script lang="ts">
  import Button from '@mathesar/component-library/button/Button.svelte';
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
    <LinkSection
      type="in_this_table"
      links={linksInThisTable}
      showCreateLinkButton
    />
  {/if}
  {#if linksFromOtherTables.length}
    <LinkSection
      type="from_other_tables"
      links={linksFromOtherTables}
      showCreateLinkButton={!linksInThisTable.length}
    />
  {/if}
  {#if !linksInThisTable.length && !linksFromOtherTables.length}
    <div>
      <!-- TODO: Update designs once its updated on Figma -->
      <Button
        on:click={() => linkTableModal.open()}
        appearance="plain"
        class="padding-zero">Create Link</Button
      >
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
</style>
