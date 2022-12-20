<script lang="ts">
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';
  import { currentTable } from '@mathesar/stores/tables';
  import LinkTableForm from './LinkTableForm.svelte';

  export let controller: ModalController;
</script>

{#if $currentTable}
  <ControlledModal {controller} size="large" title="Create Link">
    <LinkTableForm base={$currentTable} close={() => controller.close()} />
  </ControlledModal>
{/if}
