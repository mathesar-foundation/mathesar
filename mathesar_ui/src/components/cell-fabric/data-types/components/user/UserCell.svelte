<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import type {
    RecordsSummaryListResponse,
    SummarizedRecordReference,
  } from '@mathesar/api/rpc/_common/commonTypes';
  import type { User } from '@mathesar/api/rpc/users';
  import Default from '@mathesar/components/Default.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import AsyncStore from '@mathesar/stores/AsyncStore';
  import { type UserModel, getGlobalUsersStore } from '@mathesar/stores/users';
  import { rowSeekerContext } from '@mathesar/systems/row-seeker/AttachableRowSeekerController';
  import type { RowSeekerRecordStore } from '@mathesar/systems/row-seeker/RowSeekerController';
  import {
    type UserDisplayField,
    getUserLabel,
  } from '@mathesar/utils/userUtils';
  import {
    Icon,
    Spinner,
    compareWholeValues,
    iconExpandDown,
  } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';
  import type { CellExternalProps } from '../typeDefinitions';

  const dispatch = createEventDispatcher();

  export let isActive: CellExternalProps['isActive'];
  export let value: CellExternalProps['value'] = undefined;
  export let searchValue: CellExternalProps['searchValue'] = undefined;
  export let recordSummary: CellExternalProps['recordSummary'] = undefined;
  export let setRecordSummary:
    | ((recordId: string, recordSummary: string) => void)
    | undefined = undefined;
  export let disabled: CellExternalProps['disabled'];
  export let isIndependentOfSheet: CellExternalProps['isIndependentOfSheet'];
  export let userDisplayField: UserDisplayField = 'full_name';

  let cellWrapperElement: HTMLElement;
  let wasActiveBeforeClick = false;

  const usersStore = getGlobalUsersStore();
  const rowSeekerController = rowSeekerContext.get();

  $: hasValue = value !== undefined && value !== null;
  $: valueComparisonOutcome = compareWholeValues(searchValue, value);
  $: users = usersStore ? get(usersStore.users) : [];
  $: isLoadingUsers = usersStore
    ? get(usersStore.requestStatus)?.state === 'processing'
    : false;

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

  // Get previous value for row seeker
  function getPreviousValue(): SummarizedRecordReference | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    const user = users.find((u) => u.id === value);
    if (!user) {
      return {
        key: value,
        summary: recordSummary ?? String(value),
      };
    }
    const userApiFormat = user.getUser();
    return {
      key: user.id,
      summary: getUserLabel(userApiFormat, userDisplayField),
    };
  }

  async function launchRowSeeker(event?: MouseEvent) {
    if (disabled || !rowSeekerController) return;
    event?.stopPropagation();

    // Ensure users are loaded
    if (usersStore && get(usersStore.requestStatus)?.state !== 'success') {
      await usersStore.fetchUsers();
    }

    try {
      const selection = await rowSeekerController.acquireUserSelection({
        triggerElement: cellWrapperElement,
        previousValue: getPreviousValue(),
        constructRecordStore: createUserRecordStore,
        onSelect: (v) => {
          if (v) {
            const user = users.find((u) => u.id === v.key);
            if (user && setRecordSummary) {
              const userApiFormat = user.getUser();
              const userDisplayValue = getUserLabel(
                userApiFormat,
                userDisplayField,
              );
              setRecordSummary(String(v.key), userDisplayValue);
            }
          }
        },
      });

      if (selection) {
        value = selection.key as number;
        const user = users.find((u) => u.id === selection.key);
        if (user && setRecordSummary) {
          const userApiFormat = user.getUser();
          const userDisplayValue = getUserLabel(
            userApiFormat,
            userDisplayField,
          );
          setRecordSummary(String(selection.key), userDisplayValue);
        }
      } else {
        value = null;
      }
      dispatch('update', { value });
    } catch {
      // User cancelled selection
    }

    // Re-focus the cell element so that the user can use the keyboard to move
    // the active cell.
    cellWrapperElement?.focus();
  }

  function handleWrapperKeyDown(e: KeyboardEvent) {
    if (['Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      dispatch('movementKeyDown', {
        originalEvent: e,
        key: e.key,
      });
      return;
    }

    switch (e.key) {
      case 'Enter':
        if (isActive && !disabled) {
          void launchRowSeeker();
        }
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        dispatch('movementKeyDown', {
          originalEvent: e,
          key: e.key,
        });
        break;
      default:
        break;
    }
  }

  function handleMouseDown() {
    wasActiveBeforeClick = isActive;
    dispatch('activate');
  }

  function handleClick() {
    if (wasActiveBeforeClick && !disabled) {
      void launchRowSeeker();
    }
  }
</script>

<CellWrapper
  bind:element={cellWrapperElement}
  {isActive}
  {disabled}
  {isIndependentOfSheet}
  on:mouseenter
  on:keydown={handleWrapperKeyDown}
  on:mousedown={handleMouseDown}
  on:click={handleClick}
  on:dblclick={launchRowSeeker}
  hasPadding={false}
>
  <div class="user-cell" class:disabled>
    <div class="value">
      {#if isLoadingUsers && !hasValue}
        <Spinner />
      {:else if hasValue}
        <LinkedRecord
          recordId={value}
          {recordSummary}
          {valueComparisonOutcome}
          {disabled}
        />
      {:else if value === undefined}
        <Default />
      {:else}
        <Null />
      {/if}
    </div>
    {#if !disabled && isActive}
      <button
        class="dropdown-button passthrough"
        on:click|stopPropagation={(e) => launchRowSeeker(e)}
        aria-label={$_('select_user')}
        title={$_('select_user')}
        type="button"
      >
        <Icon {...iconExpandDown} />
      </button>
    {/if}
  </div>
</CellWrapper>

<style>
  .user-cell {
    flex: 1 0 auto;
    display: flex;
    justify-content: space-between;
  }
  .value {
    padding: var(--cell-padding);
    align-self: center;
    overflow: hidden;
    width: max-content;
    max-width: 100%;
    color: var(--color-fg-base);
  }
  .disabled .value {
    padding-right: var(--cell-padding);
  }
  .dropdown-button {
    cursor: pointer;
    padding: 0 var(--cell-padding);
    display: flex;
    align-items: center;
    color: var(--color-fg-base-disabled);
    background: none;
    border: none;
  }
  .dropdown-button:hover {
    color: var(--color-fg-base);
  }
</style>
