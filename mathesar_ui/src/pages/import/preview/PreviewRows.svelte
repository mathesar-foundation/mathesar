<script lang="ts">
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { postAPI, States } from '@mathesar/utils/api';
  import { setInFileStore } from '@mathesar/stores/fileImports';
  import type { FileImport, PreviewRow } from '@mathesar/stores/fileImports';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import type { CancellablePromise } from '@mathesar-component-library';
  import { getErrorMessage } from '@mathesar/utils/errors';

  interface Response {
    records: PreviewRow[];
  }

  export let fileImportStore: FileImport;
  let previewPromise: CancellablePromise<Response>;

  async function getRows() {
    previewPromise?.cancel();
    try {
      const fileImportData = get(fileImportStore);
      const { previewId } = fileImportData;
      if (previewId === undefined) {
        throw new Error('Missing previewId.');
      }
      const columns = fileImportData.previewColumns?.map((column) => ({
        id: column.id,
        name: column.name,
        type: column.type,
      }));

      setInFileStore(fileImportStore, {
        previewRowsLoadStatus: States.Loading,
        error: undefined,
      });
      const url = `/api/db/v0/tables/${previewId}/previews/`;
      previewPromise = postAPI<Response>(url, { columns });
      const result = await previewPromise;
      setInFileStore(fileImportStore, {
        previewRowsLoadStatus: States.Done,
        previewRows: result.records ?? [],
      });
    } catch (err) {
      setInFileStore(fileImportStore, {
        previewRowsLoadStatus: States.Error,
        error: getErrorMessage(err),
        previewRows: [],
      });
    }
  }

  onMount(() => {
    void getRows();

    return () => {
      previewPromise?.cancel();
    };
  });
</script>

{#each $fileImportStore.previewRows || [] as row (row)}
  <tr>
    {#each $fileImportStore.previewColumns || [] as column (column.name)}
      <td>
        <CellValue value={row[column.name]} />
      </td>
    {/each}
  </tr>
{/each}

<style lang="scss">
  tr {
    border-bottom: 1px solid #efefef;

    td {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 8px 10px;
      max-width: 200px;
    }

    &:last-child {
      border-bottom: none;
    }
  }
</style>
