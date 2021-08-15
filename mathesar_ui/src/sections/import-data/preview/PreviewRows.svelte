<script lang="ts">
  import { onMount } from 'svelte';
  import { postAPI, States } from '@mathesar/utils/api';
  import type { PreviewColumn, PreviewRow } from '@mathesar/stores/fileImports';
  import type { CancellablePromise } from '@mathesar/components';

  interface Response {
    records: PreviewRow[]
  }

  export let tableId: number;
  export let columns: PreviewColumn[];
  export let rows: PreviewRow[] = [];

  let state = States.Idle;
  let error;
  let previewPromise: CancellablePromise<Response>;

  async function getRows() {
    previewPromise?.cancel();
    try {
      state = States.Loading;
      const columnInfo = columns.map((column) => ({
        name: column.name,
        type: column.type,
      }));
      previewPromise = postAPI<Response>(`/tables/${tableId}/previews/`, {
        columns: columnInfo,
      });
      const result = await previewPromise;
      rows = result.records || [];
      state = States.Done;
    } catch (err) {
      state = States.Error;
      error = (err as Error).message;
      rows = [];
    }
  }

  onMount(() => {
    void getRows();

    return () => {
      previewPromise?.cancel();
    };
  });
</script>

{#if state === States.Loading}
  Fetching rows
{/if}

{#if state === States.Error}
  {error}
{/if}

{#each rows as row (row)}
  <tr>
    {#each columns as column (column.name)}
      <td>
        {row[column.name]}
      </td>
    {/each}
  </tr>
{/each}
