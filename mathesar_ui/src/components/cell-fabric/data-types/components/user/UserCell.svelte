<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { SummarizedRecordReference } from '@mathesar/api/rpc/_common/commonTypes';
  import Default from '@mathesar/components/Default.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import { CollaborationFeaturesContext } from '@mathesar/contexts/CollaborationFeaturesContext';
  import { rowSeekerContext } from '@mathesar/systems/row-seeker/AttachableRowSeekerController';
  import {
    type UserDisplayField,
    getUserLabel,
  } from '@mathesar/utils/userUtils';
  import {
    Icon,
    Spinner,
    Tooltip,
    compareWholeValues,
    iconExpandDown,
    iconWarning,
  } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';
  import type { CellExternalProps } from '../typeDefinitions';

  import { createUserRecordStore } from './userRecordUtils';

  const dispatch = createEventDispatcher();
  const collabContext = CollaborationFeaturesContext.get();

  export let isActive: CellExternalProps['isActive'];
  export let value: CellExternalProps['value'] = undefined;
  export let setValue: (newValue: CellExternalProps['value']) => void;
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

  const rowSeekerController = rowSeekerContext.get();

  $: collaboratorsApiStore = $collabContext.collaborators;
  $: void collaboratorsApiStore.runConservatively();
  $: collaborators = $collaboratorsApiStore.resolvedValue
    ? [...$collaboratorsApiStore.resolvedValue.values()]
    : [];
  $: users = collaborators.map((c) => c.userInfo);
  $: isLoadingCollaborators = $collaboratorsApiStore.isLoading;
  $: hasCollaboratorsSettled = $collaboratorsApiStore.hasSettled;
  $: hasCollaboratorsLoadingFailed = $collaboratorsApiStore.isRejected;

  $: hasUserIdValue = value !== undefined && value !== null;
  $: valueComparisonOutcome = compareWholeValues(searchValue, value);
  $: showBrokenLink =
    hasUserIdValue &&
    hasCollaboratorsSettled &&
    !users.some((u) => u.id === Number(value));

  // Get previous value for row seeker
  function getPreviousValue(): SummarizedRecordReference | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    const user = users.find((u) => u.id === Number(value));
    if (!user) {
      return {
        key: value,
        summary: recordSummary ?? String(value),
      };
    }
    return {
      key: user.id,
      summary: getUserLabel(user, userDisplayField),
    };
  }

  async function launchRowSeeker(event?: MouseEvent) {
    if (disabled || !rowSeekerController) return;
    event?.stopPropagation();

    if (hasCollaboratorsLoadingFailed) {
      await collaboratorsApiStore?.run();
    }

    try {
      const selection = await rowSeekerController.acquireUserSelection({
        triggerElement: cellWrapperElement,
        previousValue: getPreviousValue(),
        constructRecordStore: () =>
          createUserRecordStore(users, userDisplayField),
        onSelect: (v) => {
          if (v) {
            const user = users.find((u) => u.id === Number(v.key));
            if (user && setRecordSummary) {
              const userApiFormat = user;
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
        const newValue = selection.key as number;
        setValue(newValue);
        const user = users.find((u) => u.id === Number(selection.key));
        if (user && setRecordSummary) {
          const userDisplayValue = getUserLabel(user, userDisplayField);
          setRecordSummary(String(selection.key), userDisplayValue);
        }
      } else {
        setValue(null);
      }
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
      {#if isLoadingCollaborators}
        <Spinner />
      {:else if showBrokenLink}
        <span class="broken-link">
          <Tooltip aria-label={$_('user_not_found_in_user_column')}>
            <Icon slot="trigger" {...iconWarning} />
            <span slot="content">
              {$_('user_not_found_in_user_column')}
            </span>
          </Tooltip>
          <span class="broken-value">{value}</span>
        </span>
      {:else if hasUserIdValue}
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
        on:click|stopPropagation={launchRowSeeker}
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
  .broken-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--color-fg-base-disabled);
  }
  .broken-value {
    text-decoration: line-through;
  }
</style>
