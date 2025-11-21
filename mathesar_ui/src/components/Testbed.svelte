<script lang="ts">
  import { readable } from 'svelte/store';

  import { databasesStore } from '../stores/databases';
  import { currentSchema } from '../stores/schemas';
  import { currentTables } from '../stores/tables';
  import { multiTaggerContext } from '../systems/multi-tagger/AttachableMultiTaggerController';

  const multiTaggerController = multiTaggerContext.getOrError();

  let triggerElement: HTMLDivElement;

  $: database = databasesStore.currentDatabase;
  $: schema = $currentSchema;
  $: schemaName = schema?.name ?? readable('');
  $: tables = $currentTables;

  function open() {
    if (!$database) return;
    const movies = tables.find((t) => t.name === 'movies');
    const moviesGenres = tables.find((t) => t.name === 'movies_genres');
    const genres = tables.find((t) => t.name === 'genres');
    if (!movies) return;
    if (!moviesGenres) return;
    if (!genres) return;

    multiTaggerController.open({
      triggerElement,
      database: { id: $database.id },
      currentTable: { oid: movies.oid, pkColumnAttnum: 1 },
      currentRecordPk: 1,
      intermediateTable: {
        oid: moviesGenres.oid,
        attnumOfFkToCurrentTable: 2,
        attnumOfFkToTargetTable: 3,
      },
      targetTable: { oid: genres.oid, pkColumnAttnum: 1 },
    });
  }
</script>

{#if $schemaName === 'movie_rentals'}
  <div class="testbed">
    <h2>Testbed</h2>

    <div>Galaxy Quest genres</div>

    <div class="cell" bind:this={triggerElement} on:click={open} />
  </div>
{/if}

<style>
  .testbed {
    margin-bottom: 2rem;
  }
  .cell {
    height: 40px;
    width: 200px;
    border: 1px solid gray;
    background: white;
  }
</style>
