<script>
  import { Collapsible } from '@mathesar-component-library-dir';
  import RenameTableProperty from './RenameTableProperty.svelte';
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
</div>

<style>
  .table-mode-container {
    padding: 1rem 0;
  }

  .property-container {
    padding: 1rem;
  }
</style>
