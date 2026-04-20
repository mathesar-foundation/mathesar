<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { readable } from 'svelte/store';

  import LinkedRecordInput from '@mathesar/components/cell-fabric/data-types/components/linked-record/LinkedRecordInput.svelte';
  import { type UserModel, getGlobalUsersStore } from '@mathesar/stores/users';
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

  const usersStore = getGlobalUsersStore();

  // Use proper store subscriptions with readable fallbacks
  const usersReadable = usersStore?.users ?? readable<UserModel[]>([]);
  const requestStatusReadable =
    usersStore?.requestStatus ?? readable(undefined);

  $: users = $usersReadable;
  $: isLoading = $requestStatusReadable?.state === 'processing';
  $: error = (() => {
    if ($requestStatusReadable?.state === 'failure') {
      return ($requestStatusReadable as { state: 'failure'; errors?: string[] })
        ?.errors?.[0];
    }
    return undefined;
  })();
  $: selectedUser = users.find((u) => u.id === value);
  $: recordSummary = selectedUser
    ? getUserLabel(selectedUser.getUser(), userDisplayField)
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

<div class="user-input">
  {#if isLoading}
    <Spinner />
  {:else if error}
    <div class="error">{error}</div>
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
</div>

<style>
  .user-input {
    width: 100%;
  }
  .error {
    color: var(--color-fg-error);
    padding: var(--sm4);
  }
</style>
