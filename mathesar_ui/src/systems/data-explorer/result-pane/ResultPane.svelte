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
      Please add a column from the column selection pane to get started.
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
    margin: 10px;
    display: flex;
    flex-direction: column;
    border: 1px solid #e5e5e5;
    border-radius: 4px;

    header {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e5e5;
      display: flex;
      align-items: center;

      .title {
        font-weight: 600;
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
  }
</style>
