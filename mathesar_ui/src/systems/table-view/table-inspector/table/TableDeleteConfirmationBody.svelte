<script lang="ts">
  import { TextInput } from '@mathesar/component-library';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { confirmationController } from '@mathesar/stores/confirmation';

  export let tableName: string;

  let value = '';

  let canProceed = confirmationController.canProceed;
  $: $canProceed = value.trim().toLowerCase() === tableName.toLowerCase();
</script>

<div class="table-delete-confirmation-body">
  <p>
    To confirm the deletion of the <strong>{tableName}</strong> table, please enter
    the table name into the input field below.
  </p>
  <TextInput autofocus bind:value />
  <WarningBox>
    Warning: This action is permanent and once deleted, the table cannot be
    recovered
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
