<script lang="ts">
  import type { Database } from '@mathesar/AppTypes';
  import databaseConnection from '@mathesar/api/databaseConnection';
  import { getApiErrorMessages } from '@mathesar/api/utils/errors';
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import {
    Button,
    Checkbox,
    ControlledModal,
    Icon,
    LabeledInput,
    ModalController,
    iconLoading,
  } from '@mathesar/component-library';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ success: undefined }>();

  export let controller: ModalController;
  export let database: Database;

  let removeMathesarSchemas = false;

  let disconnectStatus: RequestStatus | undefined;

  function handleClose() {
    controller.close();
    removeMathesarSchemas = false;
  }
  async function handleDisconnect() {
    disconnectStatus = { state: 'processing' };
    try {
      await databaseConnection.delete(database.id, removeMathesarSchemas);
      disconnectStatus = { state: 'success' };
      dispatch('success');
      handleClose();
    } catch (e) {
      disconnectStatus = { state: 'failure', errors: getApiErrorMessages(e) };
    }
  }
</script>

<ControlledModal title="Disconnect Database?" {controller}>
  <LabeledInput
    layout="inline-input-first"
    label="Remove Mathesar schemas as well"
  >
    <Checkbox bind:checked={removeMathesarSchemas} />
  </LabeledInput>

  <p>
    Deleting these schemas will also delete any database objects that depend on
    them. This should not be an issue if you don't have any data using
    Mathesar's custom data types.
  </p>

  <p>Learn more about the implications of deleting the Mathesar schema.</p>

  <div class="footer">
    <Button on:click={handleClose}>Cancel</Button>
    <Button appearance="primary" on:click={handleDisconnect}>
      {#if disconnectStatus?.state === 'processing'}
        <Icon {...iconLoading} />
      {/if}
      <span>Disconnect Database</span>
    </Button>
  </div>
</ControlledModal>

<style>
  .footer {
    display: flex;
    justify-content: space-between;
  }
</style>
