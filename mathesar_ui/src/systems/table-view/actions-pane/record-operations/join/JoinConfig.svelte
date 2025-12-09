<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import type { JoinableTablesResult } from '@mathesar/api/rpc/tables';
  import TableName from '@mathesar/components/TableName.svelte';
  import type { Joining } from '@mathesar/stores/table-data';
  import {
    Checkbox,
    Collapsible,
    Help,
    LabeledInput,
  } from '@mathesar-component-library';

  import {
    type SimpleManyToManyRelationship,
    getSimpleManyToManyJoinPath,
    getSimpleManyToManyRelationships,
  } from './joinConfigUtils';

  export let joinableTables: JoinableTablesResult;
  export let joining: Writable<Joining>;

  $: simpleManyToManyRelationships =
    getSimpleManyToManyRelationships(joinableTables);

  function handleCheckboxChange(
    relationship: SimpleManyToManyRelationship,
    checked: boolean,
  ) {
    const intermediateTableOid = relationship.intermediateTable.oid;
    const joinPath = getSimpleManyToManyJoinPath(relationship);
    joining.update((j) =>
      checked
        ? j.withSimpleManyToMany(intermediateTableOid, joinPath)
        : j.withoutSimpleManyToMany(intermediateTableOid),
    );
  }
</script>

<div class="join-config">
  <Collapsible triggerAppearance="ghost" isOpen>
    <div slot="header">
      {$_('simple_many_to_many_relationships')}
      <Help>{$_('simple_many_to_many_relationships_help')}</Help>
    </div>
    <section slot="content">
      {#if simpleManyToManyRelationships.length}
        {#each simpleManyToManyRelationships as relationship}
          <LabeledInput layout="inline-input-first">
            <span slot="label">
              <TableName table={{ name: relationship.targetTable.name }} />
            </span>
            <Checkbox
              checked={$joining.simpleManyToMany.has(
                relationship.intermediateTable.oid,
              )}
              on:change={(e) => handleCheckboxChange(relationship, e.detail)}
            />
          </LabeledInput>
        {/each}
      {:else}
        <div class="empty">({$_('none')})</div>
      {/if}
    </section>
  </Collapsible>
</div>

<style>
  section {
    padding-left: 2rem;
  }
  .empty {
    color: var(--color-fg-subtle-2);
  }
</style>
