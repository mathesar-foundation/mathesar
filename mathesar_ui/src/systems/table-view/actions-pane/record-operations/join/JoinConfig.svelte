<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import type { JoinableTablesResult } from '@mathesar/api/rpc/tables';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import type { Joining } from '@mathesar/stores/table-data';
  import { currentTablesData } from '@mathesar/stores/tables';
  import { Checkbox, Help, LabeledInput } from '@mathesar-component-library';

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

  function getTableFromOid(oid: number) {
    return $currentTablesData.tablesMap.get(oid);
  }
</script>

<div class="join-config">
  <div class="header">
    {$_('simple_many_to_many_relationships')}
    <Help>{$_('simple_many_to_many_relationships_help')}</Help>
  </div>
  <section>
    {#if simpleManyToManyRelationships.length}
      {#each simpleManyToManyRelationships as relationship}
        {@const targetTable = getTableFromOid(relationship.targetTable.oid)}
        {@const intermediateTable = getTableFromOid(
          relationship.intermediateTable.oid,
        )}
        <LabeledInput layout="inline-input-first">
          <span slot="label">
            {#if targetTable && intermediateTable}
              <TableName truncate={false} table={targetTable} />
              <span class="joined-via">
                <RichText text={$_('via_column_component')} let:slotName>
                  {#if slotName === 'columnComponent'}
                    <TableName
                      bold={true}
                      truncate={false}
                      table={intermediateTable}
                    />
                  {/if}
                </RichText>
              </span>
            {:else}
              {relationship.targetTable.name}{' '}
              <RichText text={$_('via_column_component')} let:slotName>
                {#if slotName === 'columnComponent'}
                  {relationship.intermediateTable.name}
                {/if}
              </RichText>
            {/if}
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
</div>

<style>
  .header {
    font-weight: bolder;
  }

  .join-config {
    padding: var(--sm3);
  }

  section {
    margin-top: 1rem;
  }

  .empty {
    color: var(--color-fg-subtle-2);
  }

  .joined-via {
    display: inline;
    text-wrap: nowrap;
    color: var(--color-fg-subtle-2-muted);
    font-size: var(--sm1);
  }
</style>
