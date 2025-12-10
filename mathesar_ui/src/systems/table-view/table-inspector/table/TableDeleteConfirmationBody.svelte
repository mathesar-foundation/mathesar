<script lang="ts">
  import { _ } from 'svelte-i18n';

  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import type { Table } from '@mathesar/models/Table';
  import { confirmationController } from '@mathesar/stores/confirmation';
  import { TextInput } from '@mathesar-component-library';

  export let tableName: string;
  export let type: Table['type'];

  let value = '';

  const { canProceed } = confirmationController;
  $: $canProceed = value.trim().toLowerCase() === tableName.toLowerCase();
</script>

<div class="table-delete-confirmation-body">
  <p>
    <RichText
      text={type === 'view'
        ? $_('confirm_delete_view')
        : $_('confirm_delete_table')}
      let:slotName
    >
      {#if slotName === 'tableName' || slotName === 'viewName'}
        <strong>{tableName}</strong>
      {/if}
    </RichText>
  </p>
  <TextInput autofocus bind:value />
  <WarningBox>
    {$_('table_or_view_delete_permanent_warning')}
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
