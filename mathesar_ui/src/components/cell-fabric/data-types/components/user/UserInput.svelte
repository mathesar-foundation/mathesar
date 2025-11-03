<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  import type { User } from '@mathesar/api/rpc/users';
  import { api } from '@mathesar/api/rpc';
  import { Select, Spinner } from '@mathesar-component-library';
  import type { FormattedInputProps } from '@mathesar-component-library/types';

  export let value: FormattedInputProps['value'] = undefined;
  export let disabled: FormattedInputProps['disabled'] = false;
  export let placeholder: FormattedInputProps['placeholder'] = undefined;

  const dispatch = createEventDispatcher();

  let users: User[] = [];
  let isLoading = true;
  let error: string | undefined;

  async function loadUsers() {
    try {
      isLoading = true;
      error = undefined;
      users = await api.users.list().run();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load users';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    void loadUsers();
  });

  $: userOptions = users.map((user) => user.id);

  function getUserLabel(userId: number | undefined): string {
    if (!userId) return '';
    const user = users.find((u) => u.id === userId);
    if (!user) return String(userId);
    // Prefer full_name, fall back to username, then email
    return user.full_name || user.username || user.email || String(userId);
  }

  function handleChange(e: CustomEvent<number | undefined>) {
    const newValue = e.detail;
    value = newValue;
    dispatch('artificialChange', newValue);
    dispatch('artificialInput', newValue);
  }
</script>

<div class="user-input">
  {#if isLoading}
    <Spinner />
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <Select
      options={userOptions}
      {value}
      getLabel={getUserLabel}
      valuesAreEqual={(a, b) => a === b}
      {disabled}
      {placeholder}
      autoSelect="none"
      on:change={handleChange}
      let:option
    >
      {getUserLabel(option)}
    </Select>
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
