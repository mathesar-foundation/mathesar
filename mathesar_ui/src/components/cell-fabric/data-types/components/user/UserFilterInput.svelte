<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  import type { User } from '@mathesar/api/rpc/users';
  import { api } from '@mathesar/api/rpc';
  import { Select, Spinner } from '@mathesar-component-library';
  import type { FormattedInputProps } from '@mathesar-component-library/types';

  export let value: FormattedInputProps['value'] = undefined;
  export let disabled: FormattedInputProps['disabled'] = false;
  export let placeholder: FormattedInputProps['placeholder'] = undefined;
  export let userDisplayField: 'full_name' | 'email' | 'username' = 'full_name';

  const dispatch = createEventDispatcher();

  let users: User[] = [];
  let isLoading = true;

  async function loadUsers() {
    try {
      isLoading = true;
      users = await api.users.list().run();
    } catch (e) {
      console.error('Failed to load users:', e);
      users = [];
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    void loadUsers();
  });

  $: userOptions = users.map((user) => user.id);

  // Normalize value to number for comparison (filter values might come as strings)
  // This is a read-only computed value - we don't modify the value prop
  $: normalizedValue = (() => {
    if (value === undefined || value === null) return undefined;
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(numValue as number) ? undefined : (numValue as number);
  })();

  // Use normalizedValue for the Select component
  $: selectValue = normalizedValue;

  function getUserLabel(userId: number | undefined): string {
    if (userId === undefined || userId === null) return '';
    const user = users.find((u) => u.id === userId);
    if (!user) {
      // If user not found, return the ID as string (might be loading)
      return String(userId);
    }

    // Use the display field from column metadata
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

  function handleChange(e: CustomEvent<number | undefined>) {
    const newValue = e.detail;
    value = newValue;
    dispatch('artificialChange', newValue);
    dispatch('artificialInput', newValue);
  }
</script>

<div class="user-filter-input filter-input">
  {#if isLoading}
    <Spinner />
  {:else}
    <Select
      options={userOptions}
      value={selectValue}
      getLabel={getUserLabel}
      valuesAreEqual={(a, b) => {
        // Handle both number and string comparisons
        const aNum = typeof a === 'string' ? parseInt(a, 10) : a;
        const bNum = typeof b === 'string' ? parseInt(b, 10) : b;
        return aNum === bNum;
      }}
      {disabled}
      {placeholder}
      autoSelect="none"
      on:change={handleChange}
      triggerClass="user-filter-select-trigger"
      contentClass="user-filter-select-content"
    />
  {/if}
</div>

<style>
  .user-filter-input {
    width: 100%;
    display: flex;
  }

  /* Ensure dropdown content has proper styling */
  :global(.user-filter-select-content) {
    border-radius: var(--border-radius);
  }

  /* Remove border radius on left side when in InputGroup */
  /* InputGroup's CSS removes border-radius for elements that are not the last child */
  /* Since Select wraps the button in BaseInput, we need to target the actual button */
  :global(.input-group:not(.vertical) > .filter-input .user-filter-select-trigger) {
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
  }
</style>
