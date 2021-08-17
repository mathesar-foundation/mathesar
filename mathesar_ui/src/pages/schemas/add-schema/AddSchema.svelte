<script lang="ts">
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import {
    Button,
    TextInput,
    Modal,
    Icon,
  } from '@mathesar-components';
  import { currentDBName } from '@mathesar/stores/databases';
  import { schemas, createSchema } from '@mathesar/stores/schemas';
  import { States } from '@mathesar/utils/api';

  export let isOpen = false;
  let name = '';
  let state: States = States.Idle;
  let error;

  function isDuplicateName(_name: string): boolean {
    return Array.from($schemas?.data || []).some(
      ([, schema]) => (schema.name as string).toLowerCase().trim() === _name.trim(),
    );
  }

  function isDisabled(_isEditDisabled: boolean, _name: string, _isDuplicate: boolean): boolean {
    return _isEditDisabled || !name?.trim() || _isDuplicate;
  }

  $: isDuplicate = isDuplicateName(name);
  $: isEditDisabled = state === States.Loading || state === States.Done;
  $: isCreationDisabled = isDisabled(isEditDisabled, name, isDuplicate);

  async function createNewSchema() {
    try {
      state = States.Loading;
      error = null;
      await createSchema($currentDBName, name);
      state = States.Done;
    } catch (err) {
      state = States.Error;
      error = (err as Error).message;
    }
  }

  function modalClosed() {
    state = States.Idle;
    error = null;
    name = '';
  }
</script>

<Modal class="schema-modal" bind:isOpen on:close={modalClosed}>
  <div class="header">
    Create a schema
  </div>
  <div class="help-text">
    Schemas are collections of database objects such as tables and views.
    They are best when used to organize data for a specific project.
  </div>
  <div class="header">
    Name
  </div>
  <TextInput disabled={isEditDisabled} bind:value={name}/>

  {#if state === States.Loading}
    <div class="sub-text loading">
      Creating schema {name}
    </div>

  {:else if state === States.Done}
    <div class="sub-text success">
      Schema {name} created successfully.
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
    <Button on:click={() => { isOpen = false; }}>Close</Button>
    {#if state !== States.Done}
      <Button disabled={isCreationDisabled} appearance="primary" on:click={createNewSchema}>
        Create schema
        {#if state === States.Loading}
          <Icon data={faSpinner} spin={true}/>
        {/if}
      </Button>
    {/if}
  </svelte:fragment>
</Modal>
