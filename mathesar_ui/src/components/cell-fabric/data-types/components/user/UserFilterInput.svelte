<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { readable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import type { SummarizedRecordReference } from '@mathesar/api/rpc/_common/commonTypes';
  import Truncate from '@mathesar/component-library/truncate/Truncate.svelte';
  import { type UserModel, getGlobalUsersStore } from '@mathesar/stores/users';
  import { rowSeekerContext } from '@mathesar/systems/row-seeker/AttachableRowSeekerController';
  import {
    type UserDisplayField,
    getUserLabel,
  } from '@mathesar/utils/userUtils';
  import { Button, Spinner } from '@mathesar-component-library';

  import { createUserRecordStore } from './userRecordUtils';

  export let value: number | string | undefined = undefined;
  export let disabled = false;
  export let placeholder: string | undefined = undefined;
  export let userDisplayField: UserDisplayField = 'full_name';

  const dispatch = createEventDispatcher();

  const usersStore = getGlobalUsersStore();
  const rowSeekerController = rowSeekerContext.get();

  let triggerElement: HTMLElement | undefined;

  // Use proper store subscriptions with readable fallbacks
  const usersReadable = usersStore?.users ?? readable<UserModel[]>([]);
  const requestStatusReadable =
    usersStore?.requestStatus ?? readable(undefined);

  // Normalize value to number for comparison (filter values might come as strings)
  $: normalizedValue = (() => {
    if (value === undefined || value === null) return undefined;
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    return Number.isNaN(numValue) ? undefined : numValue;
  })();

  $: users = $usersReadable;
  $: isLoading = $requestStatusReadable?.state === 'processing';
  $: error = (() => {
    if ($requestStatusReadable?.state === 'failure') {
      return ($requestStatusReadable as { state: 'failure'; errors?: string[] })
        ?.errors?.[0];
    }
    return undefined;
  })();
  $: selectedUser = normalizedValue
    ? users.find((u) => u.id === normalizedValue)
    : undefined;

  // Get previous value for row seeker
  function getPreviousValue(): SummarizedRecordReference | undefined {
    if (
      normalizedValue === undefined ||
      normalizedValue === null ||
      !selectedUser
    ) {
      return undefined;
    }
    const userApiFormat = selectedUser.getUser();
    return {
      key: selectedUser.id,
      summary: getUserLabel(userApiFormat, userDisplayField),
    };
  }

  async function openRowSeeker() {
    if (disabled || !triggerElement || !rowSeekerController) return;

    // Ensure users are loaded
    if ($requestStatusReadable?.state !== 'success') {
      await usersStore?.fetchUsers();
    }

    try {
      const selection = await rowSeekerController.acquireUserSelection({
        triggerElement,
        previousValue: getPreviousValue(),
        constructRecordStore: () =>
          createUserRecordStore(users, userDisplayField),
        onSelect: (v) => {
          // selectedUser is reactive based on value, so we just update value
          if (v) {
            value = v.key as number;
            dispatch('artificialChange', v.key);
            dispatch('artificialInput', v.key);
          } else {
            value = undefined;
            dispatch('artificialChange', undefined);
            dispatch('artificialInput', undefined);
          }
        },
      });

      if (selection) {
        value = selection.key as number;
        dispatch('artificialChange', selection.key);
        dispatch('artificialInput', selection.key);
      }
    } catch {
      // User cancelled selection
    }
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
              {getUserLabel(selectedUser.getUser(), userDisplayField)}
            {:else}
              {placeholder ?? $_('select_user')}
            {/if}
          </Button>
        </div>
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
