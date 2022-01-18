<script lang="ts">
  import { onMount } from 'svelte';
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import { Button, TextInput, Modal, Icon } from '@mathesar-component-library';
  import type { SchemaEntry } from '@mathesar/App.d';
  import { currentDBName } from '@mathesar/stores/databases';
  import {
    schemas,
    createSchema,
    updateSchema,
  } from '@mathesar/stores/schemas';
  import { States } from '@mathesar/utils/api';

  export let isOpen = false;
  export let schema: SchemaEntry | undefined = undefined;

  let name = '';
  let state: States = States.Idle;
  let error: string | undefined;

  onMount(() => {
    if (schema) {
      name = schema.name;
    }
  });

  function isDuplicateName(
    _schema: SchemaEntry | undefined,
    _name: string,
  ): boolean {
    if (
      !!_schema &&
      _name.toLowerCase().trim() === schema.name.toLowerCase().trim()
    ) {
      return false;
    }
    return Array.from($schemas?.data || []).some(
      ([, _schema]) =>
        (_schema.name as string).toLowerCase().trim() === _name.trim(),
    );
  }

  function isDisabled(
    _isEditDisabled: boolean,
    _name: string,
    _isDuplicate: boolean,
  ): boolean {
    return _isEditDisabled || !name.trim() || _isDuplicate;
  }

  $: isDuplicate = isDuplicateName(schema, name);
  $: isInputDisabled = state === States.Loading || state === States.Done;
  $: isCreationDisabled = isDisabled(isInputDisabled, name, isDuplicate);

  async function saveSchema() {
    try {
      state = States.Loading;
      error = undefined;
      if (schema) {
        await updateSchema($currentDBName, { ...schema, name });
      } else {
        await createSchema($currentDBName, name);
      }
      state = States.Done;
    } catch (err) {
      state = States.Error;
      error = (err as Error).message;
    }
  }
</script>

<Modal class="schema-modal" bind:isOpen allowClose={state !== States.Loading}>
  <div class="header">
    {schema ? 'Update schema' : 'Create a schema'}
  </div>
  {#if !schema}
    <div class="help-text">
      Schemas are collections of database objects such as tables and views. They
      are best when used to organize data for a specific project.
    </div>
  {/if}

  <div class="sub-header">Name</div>
  <TextInput disabled={isInputDisabled} bind:value={name} />

  {#if state === States.Loading}
    <div class="sub-text loading">
      Saving schema '{name}'
    </div>
  {:else if state === States.Done}
    <div class="sub-text success">
      Schema '{name}' saved successfully.
    </div>
  {:else if isDuplicate || error}
    <div class="sub-text error">
      {#if isDuplicate}
        A schema with name '{name}' is already present.
      {:else}
        {error}
      {/if}
    </div>
  {/if}

  <svelte:fragment slot="footer">
    <Button
      disabled={state === States.Loading}
      on:click={() => {
        isOpen = false;
      }}>Close</Button
    >
    {#if state !== States.Done}
      <Button
        disabled={isCreationDisabled}
        appearance="primary"
        on:click={saveSchema}
      >
        {schema ? 'Save' : 'Create'} schema
        {#if state === States.Loading}
          <Icon data={faSpinner} spin={true} />
        {/if}
      </Button>
    {/if}
  </svelte:fragment>
</Modal>
