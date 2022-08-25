<script>
  import { Collapsible } from '@mathesar-component-library-dir';
  import TableConstraints from '../constraints/TableConstraints.svelte';
  import RenameTableProperty from './RenameTableProperty.svelte';
  import ConstraintHelp from '../constraints/__help__/ConstraintHelp.svelte';
</script>

<div class="table-mode-container">
  <Collapsible noStyle>
    <div slot="header">
      <span>Table Properties</span>
    </div>
    <div slot="content" class="property-container">
      <RenameTableProperty />
    </div>
  </Collapsible>

  <Collapsible noStyle>
    <div slot="header">
      <span>Links</span>
      <ConstraintHelp />
    </div>
    <div slot="content" class="property-container">
      <TableConstraints />
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
</style>
