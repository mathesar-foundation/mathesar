<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type {
    Constraint,
    ConstraintType,
  } from '@mathesar/api/rpc/constraints';
  import { Button, Collapsible, Help, Icon } from '@mathesar/component-library';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';

  import ConstraintCollapseHeader from './ConstraintCollapseHeader.svelte';
  import ConstraintDetails from './ConstraintDetails.svelte';
  import ForeignKeyConstraintDetails from './ForeignKeyConstraintDetails.svelte';
  import NewFkConstraint from './NewFkConstraint.svelte';
  import NewUniqueConstraint from './NewUniqueConstraint.svelte';

  export let constraintType: ConstraintType;
  export let constraints: Constraint[];

  const tabularData = getTabularDataStoreFromContext();

  $: ({ constraintsDataStore, table } = $tabularData);

  const CONSTRAINT_TYPE_SUPPORTING_CAN_ADD: ConstraintType[] = [
    'unique',
    'foreignkey',
  ];
  const CONSTRAINT_TYPE_SUPPORTING_CAN_DROP: ConstraintType[] = [
    'unique',
    'foreignkey',
  ];

  let isAddingNewConstraint = false;

  const helpMap: Record<ConstraintType, string> = {
    primary: $_('primary_key_help'),
    foreignkey: $_('foreign_key_help'),
    unique: $_('unique_key_help'),
    check: '',
    exclude: '',
  };

  const titleMap: Record<ConstraintType, string> = {
    primary: $_('primary_keys'),
    foreignkey: $_('foreign_keys'),
    unique: $_('unique'),
    check: '',
    exclude: '',
  };

  function addConstraint() {
    isAddingNewConstraint = true;
  }

  function cancelAddConstraint() {
    isAddingNewConstraint = false;
  }

  function handleDrop(constraint: Constraint) {
    void confirmDelete({
      identifierType: $_('constraint'),
      identifierName: constraint.name,
      body: [$_('are_you_sure_to_proceed')],
      onProceed: () => constraintsDataStore.remove(constraint.oid),
    });
  }

  $: currentRoleOwnsTable = table.currentAccess.currentRoleOwns;
  $: canAdd =
    $currentRoleOwnsTable &&
    CONSTRAINT_TYPE_SUPPORTING_CAN_ADD.includes(constraintType);
  $: canDrop =
    $currentRoleOwnsTable &&
    CONSTRAINT_TYPE_SUPPORTING_CAN_DROP.includes(constraintType);
</script>

<div class="constraint-type-section">
  <span class="title">
    <span>
      {titleMap[constraintType]}
      <Help>{helpMap[constraintType]}</Help>
    </span>
    {#if canAdd}
      <Button appearance="plain-primary" size="small" on:click={addConstraint}>
        {$_('add')}
      </Button>
    {/if}
  </span>
  {#if isAddingNewConstraint}
    <div class="add-constraint">
      {#if constraintType === 'foreignkey'}
        <NewFkConstraint onClose={cancelAddConstraint} />
      {:else if constraintType === 'unique'}
        <NewUniqueConstraint onClose={cancelAddConstraint} />
      {/if}
    </div>
  {/if}
  {#each constraints as constraint (constraint.oid)}
    <Collapsible triggerAppearance="ghost">
      <span slot="header">
        <ConstraintCollapseHeader {constraint} />
      </span>
      <span slot="trigger-aside">
        {#if canDrop}
          <Button
            on:click={() => handleDrop(constraint)}
            size="small"
            appearance="plain"
          >
            <Icon {...iconDeleteMajor} />
          </Button>
        {/if}
      </span>
      <div slot="content">
        {#if constraintType === 'foreignkey'}
          <ForeignKeyConstraintDetails {constraint} />
        {:else}
          <ConstraintDetails {constraint} />
        {/if}
      </div>
    </Collapsible>
  {:else}
    {#if !isAddingNewConstraint}
      <span class="null">
        {$_('no_type_constraints', {
          values: { constraintType: titleMap[constraintType] },
        })}
      </span>
    {/if}
  {/each}
</div>

<style lang="scss">
  .constraint-type-section {
    display: flex;
    flex-direction: column;

    :global(.collapsible-header) {
      padding-left: 0;
    }

    :global(.collapsible-content) {
      padding-left: var(--size-x-large);
    }

    .null {
      font-size: var(--text-size-small);
    }
  }
  .title {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    font-size: var(--text-size-large);
    font-weight: var(--font-weight-medium);
    border-bottom: 1px solid var(--border-color);
    min-height: 2.5rem;
    margin-bottom: var(--size-xx-small);
  }

  .add-constraint {
    padding: var(--size-base);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-m);
  }
</style>
