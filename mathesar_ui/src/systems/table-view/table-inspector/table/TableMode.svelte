<script>
  import { Collapsible } from '@mathesar-component-library';
  import TableConstraints from '@mathesar/systems/table-view/constraints/TableConstraints.svelte';
  import RenameTable from './RenameTable.svelte';
  // import ConstraintHelp from '../../constraints/__help__/ConstraintHelp.svelte';
  import TableActions from './TableActions.svelte';
  import CollapsibleHeader from '../CollapsibleHeader.svelte';
</script>

<div class="table-mode-container">
  <Collapsible isOpen>
    <CollapsibleHeader
      slot="header"
      title="Properties"
      isDBLevelConfiguration
    />
    <div slot="content" class="content-container">
      <RenameTable />
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
      <TableConstraints />
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
