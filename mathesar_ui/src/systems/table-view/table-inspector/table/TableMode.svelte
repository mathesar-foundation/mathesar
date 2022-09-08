<script>
  import { Collapsible } from '@mathesar-component-library';
  import TableConstraints from '@mathesar/systems/table-view/constraints/TableConstraints.svelte';
  import RenameTable from './RenameTable.svelte';
  import ConstraintHelp from '../../constraints/__help__/ConstraintHelp.svelte';
  import TableActions from './TableActions.svelte';
</script>

<div class="table-mode-container">
  <Collapsible isOpen>
    <span slot="header">Table Properties</span>
    <div slot="content" class="property-container">
      <RenameTable />
    </div>
  </Collapsible>

  <Collapsible isOpen>
    <span slot="header">Constraints <ConstraintHelp /></span>
    <div slot="content" class="property-container">
      <TableConstraints />
    </div>
  </Collapsible>

  <Collapsible isOpen>
    <span slot="header">Actions</span>
    <div slot="content" class="actions-container">
      <TableActions />
    </div>
  </Collapsible>
</div>

<style>
  .table-mode-container {
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .property-container {
    padding: 1rem;
  }

  .actions-container {
    padding: 1rem 0;
  }
</style>
