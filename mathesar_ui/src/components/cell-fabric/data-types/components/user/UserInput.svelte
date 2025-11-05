<script lang="ts">
  import { createEventDispatcher, onMount, setContext } from 'svelte';

  import type { User } from '@mathesar/api/rpc/users';
  import { api } from '@mathesar/api/rpc';
  import type {
    RecordsSummaryListResponse,
    SummarizedRecordReference,
  } from '@mathesar/api/rpc/_common/commonTypes';
  import AsyncStore from '@mathesar/stores/AsyncStore';
  import type { RowSeekerRecordStore } from '@mathesar/systems/row-seeker/RowSeekerController';
  import {
    AttachableRowSeekerController,
    rowSeekerContext,
  } from '@mathesar/systems/row-seeker/AttachableRowSeekerController';
  import AttachableRowSeeker from '@mathesar/systems/row-seeker/AttachableRowSeeker.svelte';
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

  let users: User[] = [];
  let isLoading = true;
  let error: string | undefined;
  let selectedUser: User | undefined;
  let recordSummary: string | undefined = undefined;
  let rowSeekerController = new AttachableRowSeekerController();

  // Set up context for row seeker
  setContext(rowSeekerContext.key, rowSeekerController);

  async function loadUsers() {
    try {
      isLoading = true;
      error = undefined;
      users = await api.users.list().run();
      // Update selected user and record summary if value is set
      if (value !== undefined && value !== null) {
        selectedUser = users.find((u) => u.id === value);
        if (selectedUser) {
          recordSummary = getUserLabel(selectedUser, userDisplayField);
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load users';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    void loadUsers();
  });

  // Convert users to SummarizedRecordReference format
  function convertUsersToRecords(
    _users: User[],
    searchQuery?: string,
    limit?: number,
    offset?: number,
  ): RecordsSummaryListResponse {
    // Filter users based on search query
    let filteredUsers = _users;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredUsers = _users.filter(
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
      if (v) {
        const user = users.find((u) => u.id === v.key);
        if (user) {
          selectedUser = user;
          recordSummary = getUserLabel(user, userDisplayField);
        }
      } else {
        selectedUser = undefined;
        recordSummary = undefined;
      }
    },
  });

  function setRecordSummary(key: string, summary: string) {
    recordSummary = summary;
  }

  // Update selected user when value changes externally
  $: if (value !== undefined && value !== null && users.length > 0) {
    selectedUser = users.find((u) => u.id === value);
    if (selectedUser) {
      recordSummary = getUserLabel(selectedUser, userDisplayField);
    }
  } else if (value === undefined || value === null) {
    selectedUser = undefined;
    recordSummary = undefined;
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
    <AttachableRowSeeker controller={rowSeekerController} />
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
