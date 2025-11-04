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
  import { Button, Icon, Spinner } from '@mathesar-component-library';
  import { iconDeleteMinor } from '@mathesar/icons';
  import {
    getUserLabel,
    type UserDisplayField,
  } from '@mathesar/utils/userUtils';
  import Truncate from '@mathesar/component-library/truncate/Truncate.svelte';

  export let value: number | string | undefined = undefined;
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

  // Normalize value to number for comparison (filter values might come as strings)
  $: normalizedValue = (() => {
    if (value === undefined || value === null) return undefined;
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(numValue as number) ? undefined : (numValue as number);
  })();

  async function loadUsers() {
    try {
      isLoading = true;
      error = undefined;
      users = await api.users.list().run();
      // Update selected user if value is set
      if (normalizedValue !== undefined && normalizedValue !== null) {
        selectedUser = users.find((u) => u.id === normalizedValue);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load users';
      users = [];
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
    if (
      normalizedValue === undefined ||
      normalizedValue === null ||
      !selectedUser
    ) {
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
  $: if (
    normalizedValue !== undefined &&
    normalizedValue !== null &&
    users.length > 0
  ) {
    selectedUser = users.find((u) => u.id === normalizedValue);
  } else if (normalizedValue === undefined || normalizedValue === null) {
    selectedUser = undefined;
  }
</script>

<div class="user-filter-input filter-input">
  <Truncate>
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
            class="user-filter-select-trigger"
          >
            {#if selectedUser}
              {getUserLabel(selectedUser, userDisplayField)}
            {:else}
              {placeholder ?? 'Select user'}
            {/if}
          </Button>
        </div>
        <AttachableRowSeeker controller={rowSeekerController} />
      </div>
    {/if}
  </Truncate>
</div>

<style>
  .user-filter-input {
    width: 140px;
    display: flex;
  }

  .user-filter-input > :global(.truncate) {
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
    width: 100%;
  }
  :global(.user-filter-select-trigger) {
    width: 100%;
    justify-content: flex-start;
    text-align: left;
    border-radius: 0 !important;
  }
  :global(.clear-button) {
    padding: 0;
    min-width: unset;
    width: 1.5rem;
    height: 1.5rem;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--color-fg-subtle-1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.clear-button:hover) {
    color: var(--color-fg-base);
  }

  /* Constrain row seeker dropdown width in filter context */
  :global(.filter-input [data-attachable-dropdown]) {
    max-width: min(30rem, calc(100vw - 2rem));
    /* Ensure dropdown doesn't exceed parent container width */
    overflow-x: hidden;
  }

  :global(.filter-input [data-row-seeker]) {
    /* Constrain to dropdown width, but allow it to be narrower if needed */
    max-width: 100%;
    box-sizing: border-box;
  }

  /* Remove background for filter context */
  :global(.filter-input [data-row-seeker] [data-row-seeker-controls]) {
    background: transparent;
  }

  :global(.filter-input [data-attachable-dropdown]) {
    background: transparent;
  }

  /* Remove border radius on left side when in InputGroup */
  /* InputGroup's CSS removes border-radius for elements that are not the last child */
  :global(
      .input-group:not(.vertical) > .filter-input .user-filter-select-trigger
    ) {
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
  }
</style>
