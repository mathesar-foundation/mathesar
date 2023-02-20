<script lang="ts">
  import type { ConstraintType } from '@mathesar/api/types/tables/constraints';
  import { Button, Collapsible, Help, Icon } from '@mathesar/component-library';
  import type { Constraint } from '@mathesar/stores/table-data';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import ConstraintCollapseHeader from './ConstraintCollapseHeader.svelte';
  import NewUniqueConstraint from './NewUniqueConstraint.svelte';
  import NewFkConstraint from './NewFkConstraint.svelte';
  import ConstraintDetails from './ConstraintDetails.svelte';
  import ForeignKeyConstraintDetails from './ForeignKeyConstraintDetails.svelte';

  export let constraintType: ConstraintType;
  export let constraints: Constraint[];
  export let canExecuteDDL: boolean;

  const tabularData = getTabularDataStoreFromContext();

  $: constraintsDataStore = $tabularData.constraintsDataStore;

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
    primary:
      'A primary key constraint uniquely identifies each record in a table.',
    foreignkey: 'A foreign key constraint links records in two tables.',
    unique:
      'A unique constraint ensures that each record in a column is unique.',
    check: '',
    exclude: '',
  };

  const titleMap: Record<ConstraintType, string> = {
    primary: 'Primary Keys',
    foreignkey: 'Foreign Keys',
    unique: 'Unique',
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
      identifierType: 'Constraint',
      identifierName: constraint.name,
      body: ['Are you sure you want to proceed?'],
      onProceed: () => constraintsDataStore.remove(constraint.id),
    });
  }

  $: canAdd =
    CONSTRAINT_TYPE_SUPPORTING_CAN_ADD.includes(constraintType) &&
    canExecuteDDL;
  $: canDrop =
    CONSTRAINT_TYPE_SUPPORTING_CAN_DROP.includes(constraintType) &&
    canExecuteDDL;
</script>

<div class="constraint-type-section">
  <span class="title">
    <span>
      {titleMap[constraintType]}
      <Help>{helpMap[constraintType]}</Help>
    </span>
    {#if canAdd}
      <Button appearance="plain-primary" size="small" on:click={addConstraint}>
        Add
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
  {#each constraints as constraint (constraint.id)}
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
      <span class="null">No {titleMap[constraintType]} Constraints</span>
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
      padding-left: 1rem;
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

    border-bottom: 1px solid var(--slate-200);
    padding: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .add-constraint {
    padding: 0.5rem;
    border: 1px solid var(--slate-300);
    border-radius: var(--border-radius-m);
  }
</style>
