<script lang="ts">
  import type { ConstraintType } from '@mathesar/api/types/tables/constraints';
  import { Button, Collapsible, Help } from '@mathesar/component-library';
  import type { Constraint } from '@mathesar/stores/table-data';
  import ConstraintCollapseHeader from './ConstraintCollapseHeader.svelte';
  import NewUniqueConstraintModal from './NewUniqueConstraintModal.svelte';
  import NewFkConstraint from './NewFkConstraint.svelte';
  import ConstraintDetails from './ConstraintDetails.svelte';
  import ForeignKeyConstraintDetails from './ForeignKeyConstraintDetails.svelte';

  export let constraintType: ConstraintType;
  export let constraints: Constraint[];

  let addConstraintType: 'foreignKey' | 'unique' | 'none' = 'none';

  const helpMap: Record<ConstraintType, string> = {
    primary:
      'A primary key constraint uniquely identifies each record in a table.',
    foreignkey: 'A foreign key constraint links records in two tables.',
    unique:
      'A unique constraint ensures that each record in a column is unique.',

    // TODO: Add them later
    check: '',
    exclude: '',
  };

  const titleMap: Record<ConstraintType, string> = {
    primary: 'Primary Keys',
    foreignkey: 'Foreign Keys',
    unique: 'Unique',

    // TODO: Add them later
    check: '',
    exclude: '',
  };

  function addNewFkConstraint() {
    addConstraintType = 'foreignKey';
  }

  function addNewUniqueConstraint() {
    addConstraintType = 'unique';
  }

  function resetAddConstraintType() {
    addConstraintType = 'none';
  }
</script>

<div class="constraint-type-section">
  <span class="title">
    <span>
      {titleMap[constraintType]}
      <Help>{helpMap[constraintType]}</Help>
    </span>
    {#if constraintType === 'unique'}
      <Button
        appearance="plain-primary"
        size="small"
        on:click={addNewUniqueConstraint}>Add</Button
      >
    {:else if constraintType === 'foreignkey'}
      <Button
        appearance="plain-primary"
        size="small"
        on:click={addNewFkConstraint}
      >
        Add
      </Button>
    {/if}
  </span>
  {#if addConstraintType !== 'none'}
    <div class="add-constraint">
      {#if addConstraintType === 'foreignKey'}
        <NewFkConstraint onClose={resetAddConstraintType} />
      {/if}
    </div>
  {/if}
  {#each constraints as constraint (constraint.id)}
    <Collapsible triggerAppearance="ghost">
      <span slot="header">
        <ConstraintCollapseHeader {constraint} />
      </span>
      <div slot="content">
        {#if constraintType === 'foreignkey'}
          <ForeignKeyConstraintDetails {constraint} />
        {:else}
          <ConstraintDetails {constraint} />
        {/if}
      </div>
    </Collapsible>
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
