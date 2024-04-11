<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SheetCellDetails } from '@mathesar/components/sheet/selection';
  import type MessageBus from '@mathesar/utils/MessageBus';
  import type QueryManager from '../QueryManager';
  import type QueryRunner from '../QueryRunner';
  import QueryRefreshButton from './QueryRefreshButton.svelte';
  import Results from './Results.svelte';

  export let queryHandler: QueryRunner | QueryManager;
  export let cellSelectionStarted: MessageBus<SheetCellDetails> | undefined =
    undefined;
</script>

<section data-identifier="result">
  <header>
    <span class="title">{$_('result')}</span>
    <div class="actions">
      <QueryRefreshButton queryRunner={queryHandler} />
    </div>
  </header>
  <Results {queryHandler} {cellSelectionStarted} />
</section>

<style lang="scss">
  section {
    height: 100%;
    position: relative;
    overflow: hidden;
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
