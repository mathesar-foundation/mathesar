<script lang="ts">
  import { Button, Spinner, Icon } from '@mathesar-component-library';
  import { iconRefresh } from '@mathesar/icons';
  import type QueryRunner from '../QueryRunner';
  import Results from './Results.svelte';

  export let queryRunner: QueryRunner;

  $: ({ query, runState } = queryRunner);
  $: ({ base_table, initial_columns } = $query);

  $: columnRunState = $runState?.state;
  $: recordRunState = $runState?.state;
</script>

<section data-identifier="result">
  <header>
    <span class="title">Result</span>
    {#if base_table && initial_columns.length}
      <span class="info">
        {#if columnRunState === 'processing' || recordRunState === 'processing'}
          Running query
          <Spinner />
        {:else if columnRunState === 'failure' || recordRunState === 'failure'}
          Query failed to run
          <Button
            appearance="plain"
            size="small"
            class="padding-zero"
            on:click={() => queryRunner.run()}
          >
            <Icon {...iconRefresh} size="0.6rem" />
            <span>Retry</span>
          </Button>
        {/if}
      </span>
    {/if}
  </header>
  {#if !initial_columns.length}
    <div class="empty-state">
      This exploration does not contain any columns. Please edit it to add
      columns.
    </div>
  {:else}
    <Results {queryRunner} />
  {/if}
</section>

<style lang="scss">
  section {
    position: relative;
    flex-grow: 1;
    overflow: hidden;
    flex-shrink: 0;
    margin: var(--size-large);
    display: flex;
    flex-direction: column;

    header {
      display: flex;
      align-items: center;
      margin-bottom: var(--size-large);

      .title {
        font-size: var(--text-size-large);
        font-weight: 590;
      }
      .info {
        margin-left: 8px;
        color: #71717a;
        font-size: 0.875rem;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
    }

    .empty-state {
      padding: 1rem;
    }

    :global([data-identifier='query-run-result']) {
      border: 1px solid var(--slate-200);
      border-radius: var(--border-radius-m);
      background: var(--sand-100);
    }
  }
</style>
