<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  import type { User } from '@mathesar/api/rpc/users';
  import { api } from '@mathesar/api/rpc';
  import Default from '@mathesar/components/Default.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import {
    AttachableDropdown,
    Icon,
    ListBox,
    ListBoxOptions,
    Spinner,
    compareWholeValues,
    getGloballyUniqueId,
    iconExpandDown,
    type ListBoxApi,
  } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';
  import type { CellExternalProps } from '../typeDefinitions';

  const dispatch = createEventDispatcher();
  const id = getGloballyUniqueId();

  export let isActive: CellExternalProps['isActive'];
  export let value: CellExternalProps['value'] = undefined;
  export let searchValue: CellExternalProps['searchValue'] = undefined;
  export let recordSummary: CellExternalProps['recordSummary'] = undefined;
  export let setRecordSummary: ((recordId: string, recordSummary: string) => void) | undefined = undefined;
  export let disabled: CellExternalProps['disabled'];
  export let isIndependentOfSheet: CellExternalProps['isIndependentOfSheet'];
  export let userDisplayField: 'full_name' | 'email' | 'username' = 'full_name';

  let cellWrapperElement: HTMLElement;
  let users: User[] = [];
  let isLoadingUsers = false;

  $: hasValue = value !== undefined && value !== null;
  $: valueComparisonOutcome = compareWholeValues(searchValue, value);
  $: userOptions = users.map((user) => user.id);

  async function loadUsers() {
    if (users.length > 0) return; // Already loaded
    try {
      isLoadingUsers = true;
      users = await api.users.list().run();
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      isLoadingUsers = false;
    }
  }

  function getUserLabel(userId: number | undefined): string {
    if (!userId) return '';
    const user = users.find((u) => u.id === userId);
    if (!user) return String(userId);

    // Use the display field from column metadata (no fallback to avoid leaking email)
    if (userDisplayField === 'full_name') {
      return user.full_name || '';
    } else if (userDisplayField === 'email') {
      return user.email || '';
    } else if (userDisplayField === 'username') {
      return user.username || '';
    }
    // Default fallback
    return user.full_name || '';
  }

  function handleDropdownClick(event: MouseEvent, api: ListBoxApi<number>) {
    event.stopPropagation();
    if (!disabled) {
      void loadUsers();
      api.open();
    }
  }

  function handleValueChange(values: number[]) {
    const newValue = values[0];
    value = newValue ?? null;

    // Set the record summary immediately if we have the user data
    if (newValue !== undefined && newValue !== null && setRecordSummary) {
      const userSummary = getUserLabel(newValue);
      setRecordSummary(String(newValue), userSummary);
    }

    dispatch('update', { value });
  }

  function handleDropdownClose(api: ListBoxApi<number>) {
    api.close();
    cellWrapperElement?.focus();
  }

  function checkAndToggle(api: ListBoxApi<number>) {
    if (disabled) return;
    void loadUsers();
    api.toggle();
  }

  function handleKeyDown(
    e: KeyboardEvent,
    api: ListBoxApi<number>,
    isOpen: boolean,
  ) {
    if (['Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      dispatch('movementKeyDown', {
        originalEvent: e,
        key: e.key,
      });
      api.close();
      return;
    }

    if (isOpen) {
      api.handleKeyDown(e);
      return;
    }

    switch (e.key) {
      case 'Enter':
        if (!disabled) {
          void loadUsers();
          api.handleKeyDown(e);
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
    // Prevent cell selection when clicking dropdown
  }

  onMount(() => {
    // Preload users when component mounts
    void loadUsers();
  });
</script>

<ListBox
  options={userOptions}
  selectionType="single"
  value={hasValue && value !== null ? [value] : []}
  on:change={(e) => handleValueChange(e.detail)}
  getLabel={getUserLabel}
  checkEquality={(a, b) => a === b}
  {disabled}
  let:api
  let:isOpen
>

  <CellWrapper
    bind:element={cellWrapperElement}
    aria-controls={id}
    aria-haspopup="listbox"
    {isActive}
    {disabled}
    {isIndependentOfSheet}
    on:mouseenter
    on:keydown={(e) => handleKeyDown(e, api, isOpen)}
    on:mousedown={handleMouseDown}
    on:click={() => checkAndToggle(api)}
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
          on:click|stopPropagation={(e) => handleDropdownClick(e, api)}
          aria-label="Select user"
          title="Select user"
          type="button"
        >
          <Icon {...iconExpandDown} />
        </button>
      {/if}
    </div>
  </CellWrapper>

  <AttachableDropdown
    trigger={cellWrapperElement}
    {isOpen}
    on:close={() => handleDropdownClose(api)}
    class="user-cell-dropdown retain-active-cell"
  >
    <ListBoxOptions {id} />
  </AttachableDropdown>
</ListBox>

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
