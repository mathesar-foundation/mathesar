<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';

  import type { User } from '@mathesar/api/rpc/users';
  import type {
    RecordsSummaryListResponse,
    SummarizedRecordReference,
  } from '@mathesar/api/rpc/_common/commonTypes';
  import AsyncStore from '@mathesar/stores/AsyncStore';
  import type { RowSeekerRecordStore } from '@mathesar/systems/row-seeker/RowSeekerController';
  import { getGlobalUsersStore, type UserModel } from '@mathesar/stores/users';
  import { makeRowSeekerOrchestratorFactory } from '@mathesar/systems/row-seeker/rowSeekerOrchestrator';
  import LinkedRecordInput from '@mathesar/components/cell-fabric/data-types/components/linked-record/LinkedRecordInput.svelte';
  import { Spinner } from '@mathesar-component-library';
  import {
    getUserLabel,
    type UserDisplayField,
  } from '@mathesar/utils/userUtils';

  export let value: number | undefined = undefined;
  export let disabled = false;
  export let placeholder: string | undefined = undefined;
  export let userDisplayField: UserDisplayField = 'full_name';

  const dispatch = createEventDispatcher();

  const usersStore = getGlobalUsersStore();
  $: users = usersStore ? get(usersStore.users) : [];
  $: isLoading = usersStore
    ? get(usersStore.requestStatus)?.state === 'processing'
    : false;
  $: error = usersStore
    ? get(usersStore.requestStatus)?.state === 'failure'
      ? get(usersStore.requestStatus)?.errors?.[0]
      : undefined
    : undefined;
  $: selectedUser = users.find((u) => u.id === value);
  $: recordSummary = selectedUser
    ? getUserLabel(selectedUser.getUser(), userDisplayField)
    : undefined;

  // Convert users to SummarizedRecordReference format
  function convertUsersToRecords(
    _users: UserModel[],
    searchQuery?: string,
    limit?: number,
    offset?: number,
  ): RecordsSummaryListResponse {
    // Convert UserModel[] to User[] format for filtering
    const usersAsApiFormat: User[] = _users.map((u) => u.getUser());

    // Filter users based on search query
    let filteredUsers = usersAsApiFormat;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredUsers = usersAsApiFormat.filter(
        (user) =>
          user.username?.toLowerCase().includes(query) ||
          user.full_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query),
      );
    }

    // Apply pagination
    const totalCount = filteredUsers.length;
    const start = offset ?? 0;
    const end = limit ? start + limit : filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(start, end);

    // Convert to SummarizedRecordReference format
    const results: SummarizedRecordReference[] = paginatedUsers.map((user) => ({
      key: user.id,
      summary: getUserLabel(user, userDisplayField),
    }));

    return {
      results,
      count: totalCount,
    };
  }

  // Create AsyncStore for row seeker
  function createUserRecordStore(): RowSeekerRecordStore {
    return new AsyncStore<
      {
        limit?: number | null;
        offset?: number | null;
        search?: string | null;
      },
      RecordsSummaryListResponse
    >(async (params) => {
      const { limit = null, offset = null, search = null } = params;
      return convertUsersToRecords(
        users,
        search ?? undefined,
        limit ?? undefined,
        offset ?? undefined,
      );
    });
  }

  // Create record selection orchestrator factory for LinkedRecordInput
  const recordSelectionOrchestratorFactory = makeRowSeekerOrchestratorFactory({
    constructRecordStore: createUserRecordStore,
    onSelect: (v) => {
      // The selectedUser and recordSummary are reactive based on value
      // This callback is mainly for side effects if needed
    },
  });

  function setRecordSummary(key: string, summary: string) {
    // Summary is computed reactively from selectedUser
    // This function is kept for API compatibility
  }
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
