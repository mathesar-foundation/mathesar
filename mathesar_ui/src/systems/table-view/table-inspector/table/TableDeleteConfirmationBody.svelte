<script lang="ts">
  import { TextInput } from '@mathesar/component-library';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { confirmationController } from '@mathesar/stores/confirmation';

  export let tableName: string;

  let value = '';

  let { canProceed } = confirmationController;
  $: $canProceed = value.trim().toLowerCase() === tableName.toLowerCase();
</script>

<div class="table-delete-confirmation-body">
  <div class="non-selectable">
    <p>
    To confirm the deletion of the <strong>{tableName}</strong> table, please enter
    the table name into the input field below.
    </p>
  </div>
  <TextInput autofocus bind:value />
  <WarningBox>
    Warning: This action is permanent and once deleted, the table cannot be
    recovered.
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

  .non-selectable {
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none; /* Non-prefixed version, currently supported by most browsers */
  }
</style>
