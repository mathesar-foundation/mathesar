<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  import type { User } from '@mathesar/api/rpc/users';
  import { api } from '@mathesar/api/rpc';
  import { Select, Spinner } from '@mathesar-component-library';
  import type { FormattedInputProps } from '@mathesar-component-library/types';
  import { getUserLabel, type UserDisplayField } from '@mathesar/utils/userUtils';

  export let value: FormattedInputProps['value'] = undefined;
  export let disabled: FormattedInputProps['disabled'] = false;
  export let placeholder: FormattedInputProps['placeholder'] = undefined;
  export let userDisplayField: UserDisplayField = 'full_name';

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
      getLabel={(userId) => {
        if (userId === null || userId === undefined) {
          return '';
        }
        const user = users.find((u) => u.id === userId);
        return user ? getUserLabel(user, userDisplayField) : String(userId);
      }}
      valuesAreEqual={(a, b) => a === b}
      {disabled}
      {placeholder}
      autoSelect="none"
      on:change={handleChange}
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
