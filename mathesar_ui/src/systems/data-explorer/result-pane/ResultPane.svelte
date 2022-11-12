<script lang="ts">
  import { Button, Icon } from '@mathesar-component-library';
  import { iconRefresh } from '@mathesar/icons';
  import type QueryRunner from '../QueryRunner';
  import Results from './Results.svelte';

  export let queryRunner: QueryRunner;

  $: ({ runState } = queryRunner);

  $: isQueryRunInProcess = $runState?.state === 'processing';
</script>

<section data-identifier="result">
  <header>
    <span class="title">Result</span>
    <div class="actions">
      <Button
        appearance="secondary"
        disabled={isQueryRunInProcess}
        on:click={() => queryRunner.run()}
      >
        <Icon {...iconRefresh} spin={isQueryRunInProcess} />
        <span>Refresh</span>
      </Button>
    </div>
  </header>
  <Results {queryRunner} />
</section>

<style lang="scss">
  section {
    position: relative;
    flex-grow: 1;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;

    header {
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--slate-200);
      padding: var(--size-xx-small);

      .title {
        font-size: var(--text-size-large);
        font-weight: 590;
      }
      .actions {
        margin-left: auto;
      }
    }
  }
</style>
