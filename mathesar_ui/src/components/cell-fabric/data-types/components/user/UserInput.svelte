<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import LinkedRecordInput from '@mathesar/components/cell-fabric/data-types/components/linked-record/LinkedRecordInput.svelte';
  import { CollaborationFeaturesContext } from '@mathesar/contexts/CollaborationFeaturesContext';
  import { makeRowSeekerOrchestratorFactory } from '@mathesar/systems/row-seeker/rowSeekerOrchestrator';
  import {
    type UserDisplayField,
    getUserLabel,
  } from '@mathesar/utils/userUtils';
  import { Spinner } from '@mathesar-component-library';

  import { createUserRecordStore } from './userRecordUtils';

  export let value: number | undefined = undefined;
  export let disabled = false;
  export let placeholder: string | undefined = undefined;
  export let userDisplayField: UserDisplayField = 'full_name';

  const dispatch = createEventDispatcher();
  const collabContext = CollaborationFeaturesContext.get();

  $: collaboratorsApiStore = $collabContext.collaborators;
  $: void collaboratorsApiStore.runConservatively();
  $: collaborators = $collaboratorsApiStore.resolvedValue
    ? [...$collaboratorsApiStore.resolvedValue.values()]
    : [];
  $: users = collaborators.map((c) => c.userInfo);
  $: isLoadingCollaborators = $collaboratorsApiStore.isLoading;
  $: error = $collaboratorsApiStore.error;

  $: selectedUser = users.find((u) => u.id === value);
  $: recordSummary = selectedUser
    ? getUserLabel(selectedUser, userDisplayField)
    : undefined;

  // Create record selection orchestrator factory for LinkedRecordInput
  const recordSelectionOrchestratorFactory = makeRowSeekerOrchestratorFactory({
    constructRecordStore: () => createUserRecordStore(users, userDisplayField),
    onSelect: () => {
      // The selectedUser and recordSummary are reactive based on value
    },
  });

  // Intentionally a no-op: recordSummary is computed reactively from
  // selectedUser, so this callback exists only for LinkedRecordInput API compat.
  const setRecordSummary: (
    recordId: string,
    summary: string,
  ) => void = () => {};
</script>

{#if isLoadingCollaborators}
  <div class="input-element user-input">
    <Spinner />
  </div>
{:else if error}
  <div class="input-element user-input">
    <div class="error">{error.message}</div>
  </div>
{:else}
  <LinkedRecordInput
    bind:value
    {recordSelectionOrchestratorFactory}
    {recordSummary}
    {setRecordSummary}
    {disabled}
    {placeholder}
    on:artificialChange={(e) => dispatch('artificialChange', e.detail)}
    on:artificialInput={(e) => dispatch('artificialInput', e.detail)}
  />
{/if}

<style>
  .user-input {
    width: 100%;
  }
  .error {
    color: var(--color-fg-error);
    padding: var(--sm4);
  }
</style>
