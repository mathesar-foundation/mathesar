<script>
  import { Collapsible } from '@mathesar-component-library';
  import RenameTable from './RenameTable.svelte';
  import TableActions from './TableActions.svelte';
  import CollapsibleHeader from '../CollapsibleHeader.svelte';
  import AdvancedActions from './AdvancedActions.svelte';
  import TableLinks from './links/TableLinks.svelte';
</script>

<div class="table-mode-container">
  <Collapsible isOpen>
    <CollapsibleHeader
      slot="header"
      title="Properties"
      isDbLevelConfiguration
    />
    <div slot="content" class="content-container">
      <RenameTable />
    </div>
  </Collapsible>

  <Collapsible isOpen>
    <CollapsibleHeader slot="header" title="Links" isDbLevelConfiguration />
    <div slot="content" class="content-container">
      <TableLinks />
    </div>
  </Collapsible>

  <Collapsible isOpen>
    <CollapsibleHeader slot="header" title="Actions" />
    <div slot="content" class="content-container">
      <TableActions />
    </div>
  </Collapsible>

  <Collapsible>
    <CollapsibleHeader slot="header" title="Advanced" />
    <div slot="content" class="content-container">
      <AdvancedActions />
    </div>
  </Collapsible>
</div>

<style>
  .table-mode-container {
    padding-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .content-container {
    padding: 1rem;
  }
</style>
