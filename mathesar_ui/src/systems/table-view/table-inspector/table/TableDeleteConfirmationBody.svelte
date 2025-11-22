<script lang="ts">
  import { _ } from 'svelte-i18n';

  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { confirmationController } from '@mathesar/stores/confirmation';
  import { TextInput } from '@mathesar-component-library';

  export let tableName: string;

  let value = '';

  const { canProceed } = confirmationController;
  $: $canProceed = value.trim().toLowerCase() === tableName.toLowerCase();
</script>

<div class="table-delete-confirmation-body">
  <p>
    <RichText text={$_('confirm_delete_table')} let:slotName>
      {#if slotName === 'tableName'}
        <strong>{tableName}</strong>
      {/if}
    </RichText>
  </p>
  <TextInput autofocus bind:value />
  <WarningBox>
    {$_('table_delete_permanent_warning')}
  </WarningBox>
</div>

<style lang="scss">
  .table-delete-confirmation-body {
    p {
      margin: 0;
    }

    display: flex;
    flex-direction: column;
    > :global(* + *) {
      margin-top: 1rem;
    }
  }
</style>
