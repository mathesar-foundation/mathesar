<script lang="ts">
  import { _ } from 'svelte-i18n';

  import PhraseContainingIdentifier from '@mathesar/components/PhraseContainingIdentifier.svelte';
  import {
    Button,
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  export let controller: ModalController;
  export let columnName: string;
  export let onSummarize: () => void;
  export let onWithoutSummarization: () => void;
</script>

<ControlledModal {controller} on:close>
  <svelte:fragment slot="title">
    <PhraseContainingIdentifier
      identifier={columnName}
      wrappingString={$_('summarize_column_with_identifier')}
    />
  </svelte:fragment>

  <div class="modal-body">
    <p>{$_('summarize_column_recommendation')}</p>
    <p>{$_('summarize_column_configure')}</p>
  </div>

  <svelte:fragment slot="footer">
    <Button appearance="secondary" on:click={onWithoutSummarization}>
      {$_('no_continue_without_summarization')}
    </Button>
    <Button appearance="primary" on:click={onSummarize}>
      {$_('yes_summarize_as_list')}
    </Button>
  </svelte:fragment>
</ControlledModal>

<style>
  .modal-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .modal-body p {
    margin: 0;
  }
</style>
