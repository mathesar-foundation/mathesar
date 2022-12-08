<script lang="ts">
  import type QueryRunner from '../QueryRunner';
  import Results from './Results.svelte';
  import QueryRefreshButton from './QueryRefreshButton.svelte';

  export let queryRunner: QueryRunner;
</script>

<section data-identifier="result">
  <header>
    <span class="title">Result</span>
    <div class="actions">
      <QueryRefreshButton {queryRunner} />
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
