<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  import type { User } from '@mathesar/api/rpc/users';
  import { api } from '@mathesar/api/rpc';
  import type {
    RecordsSummaryListResponse,
    SummarizedRecordReference,
  } from '@mathesar/api/rpc/_common/commonTypes';
  import AsyncStore from '@mathesar/stores/AsyncStore';
  import type { RowSeekerRecordStore } from '@mathesar/systems/row-seeker/RowSeekerController';
  import { AttachableRowSeekerController } from '@mathesar/systems/row-seeker/AttachableRowSeekerController';
  import AttachableRowSeeker from '@mathesar/systems/row-seeker/AttachableRowSeeker.svelte';
  import { Button, Spinner } from '@mathesar-component-library';
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
  let triggerElement: HTMLElement | undefined;
  let selectedUser: User | undefined;
  let rowSeekerController = new AttachableRowSeekerController();

  async function loadUsers() {
    try {
      isLoading = true;
      error = undefined;
      users = await api.users.list().run();
      // Update selected user if value is set
      if (value !== undefined && value !== null) {
        selectedUser = users.find((u) => u.id === value);
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

  // Get previous value for row seeker
  function getPreviousValue(): SummarizedRecordReference | undefined {
    if (value === undefined || value === null || !selectedUser) {
      return undefined;
    }
    return {
      key: selectedUser.id,
      summary: getUserLabel(selectedUser, userDisplayField),
    };
  }

  async function openRowSeeker() {
    if (disabled || !triggerElement) return;

    try {
      const selection = await rowSeekerController.acquireUserSelection({
        triggerElement,
        previousValue: getPreviousValue(),
        constructRecordStore: createUserRecordStore,
        onSelect: (v) => {
          if (v) {
            const user = users.find((u) => u.id === v.key);
            if (user) {
              selectedUser = user;
              value = user.id;
              dispatch('artificialChange', user.id);
              dispatch('artificialInput', user.id);
            }
          } else {
            selectedUser = undefined;
            value = undefined;
            dispatch('artificialChange', undefined);
            dispatch('artificialInput', undefined);
          }
        },
      });

      if (selection) {
        const user = users.find((u) => u.id === selection.key);
        if (user) {
          selectedUser = user;
          value = user.id;
          dispatch('artificialChange', user.id);
          dispatch('artificialInput', user.id);
        }
      }
    } catch {
      // User cancelled selection
    }
  }

  function clearSelection() {
    selectedUser = undefined;
    value = undefined;
    dispatch('artificialChange', undefined);
    dispatch('artificialInput', undefined);
  }

  // Update selected user when value changes externally
  $: if (value !== undefined && value !== null && users.length > 0) {
    selectedUser = users.find((u) => u.id === value);
  } else if (value === undefined || value === null) {
    selectedUser = undefined;
  }
</script>

<div class="user-input">
  {#if isLoading}
    <Spinner />
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="row-seeker-container">
      <div bind:this={triggerElement} class="trigger-wrapper">
        <Button
          appearance="secondary"
          on:click={openRowSeeker}
          {disabled}
          class="user-select-trigger"
        >
          {#if selectedUser}
            {getUserLabel(selectedUser, userDisplayField)}
          {:else}
            {placeholder ?? 'Select user'}
          {/if}
        </Button>
      </div>
      {#if selectedUser && !disabled}
        <Button
          appearance="plain"
          on:click={clearSelection}
          class="clear-button"
          aria-label="Clear selection"
        >
          ×
        </Button>
      {/if}
      <AttachableRowSeeker controller={rowSeekerController} />
    </div>
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
  .row-seeker-container {
    display: flex;
    align-items: center;
    gap: var(--sm2);
    width: 100%;
  }
  .trigger-wrapper {
    flex: 1;
  }
  :global(.user-select-trigger) {
    width: 100%;
    justify-content: flex-start;
    text-align: left;
  }
  :global(.clear-button) {
    padding: 0;
    min-width: unset;
    width: 1.5rem;
    height: 1.5rem;
    font-size: 1.2rem;
    line-height: 1;
  }
</style>
