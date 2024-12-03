<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Help from '@mathesar/component-library/help/Help.svelte';
  import SeeDocsToLearnMore from '@mathesar/components/SeeDocsToLearnMore.svelte';
  import { currentTable } from '@mathesar/stores/tables';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import LinkTableForm from './LinkTableForm.svelte';

  export let controller: ModalController;
</script>

{#if $currentTable}
  <ControlledModal {controller} size="large">
    <span slot="title">
      {$_('create_relationship')}
      <Help>
        {$_('references_help')}
        <SeeDocsToLearnMore page="relationships" />
      </Help>
    </span>
    <LinkTableForm base={$currentTable} close={() => controller.close()} />
  </ControlledModal>
{/if}
