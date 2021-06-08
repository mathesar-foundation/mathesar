<script lang="ts">
  import { schemas, reloadSchemas } from '@mathesar/stores/schemas';
  import { getFileStore, setFileStore } from '@mathesar/stores/fileImports';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { uploadFile, States } from '@mathesar/utils/api';
  import type { UploadCompletionOpts } from '@mathesar/utils/api';

  export let id: string = null;
  export let database: string = null;

  let fileImportData: FileImport;
  $: fileImportData = getFileStore(database, id);

  function completionCallback(completionStatus: UploadCompletionOpts, fileId: string) {
    setFileStore(database, fileId, {
      progress: completionStatus,
    });
  }

  function submitListener(form: Element) {
    function onSubmit(e: Event) {
      e.preventDefault();
      const fileId = form.getAttribute('data-table');
      setFileStore(database, fileId, {
        progress: null,
        error: null,
        status: States.Loading,
      });

      const formData = new FormData(this);
      formData.append('database_key', database);

      uploadFile(
        { url: '/', avoidPrefix: true },
        formData,
        (completionStatus: UploadCompletionOpts) => {
          completionCallback(completionStatus, fileId);
        },
      ).then((res) => {
        // eslint-disable-next-line no-void
        void reloadSchemas();
        setFileStore(database, fileId, {
          status: States.Done,
        });
        return res;
      }).catch((err: Error) => {
        setFileStore(database, fileId, {
          status: States.Error,
          error: err.stack,
        });
      });
    }

    form.addEventListener('submit', onSubmit);

    return {
      destroy() {
        form.removeEventListener('submit', onSubmit);
      },
    };
  }
</script>

<div class="import-file-view">
  {#if $fileImportData.status === States.Idle || $fileImportData.status === States.Error}

    {#if $fileImportData.status === States.Error}
      <div class="error">
        <strong>There was an error when trying to import file. Please try again.</strong>
        <code>
          {$fileImportData.error}
        </code>
      </div>

    {:else}
      Upload a CSV file to create a table.
    {/if}

    <form enctype="multipart/form-data" data-table='{$fileImportData.id}' use:submitListener>
      <table>
        <tbody>
          <tr>
            <td><label for="id_table_name">Table name</label></td>
            <td>
              <input type="text" name="table_name" minlength="1" required id="id_table_name"
                      bind:value={$fileImportData.name}>
            </td>
          </tr>
          <tr>
            <td><label for="id_schema_name">Schema name</label></td>
            <td>
              <input type="text" name="schema_name" minlength="1" required id="id_schema_name"
                      list="id_schema_name_data_list" bind:value={$fileImportData.schema}>
              <datalist id="id_schema_name_data_list">
                {#each $schemas.data as schema, index (schema.name + index)}
                  <option value={schema.name}/>
                {/each}
              </datalist>
            </td>
          </tr>
          <tr>
            <td><label for="id_file">CSV File</label></td>
            <td>
              <input type="file" name="file" required id="id_file">
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <button type="submit">Submit</button>
            </td>
          </tr>
        </tbody>
      </table>
    </form>

  {:else if $fileImportData.status === States.Loading}
    Uploading file... {$fileImportData.progress?.percentCompleted || 0}%

  {:else if $fileImportData.status === States.Done}
    Upload successful
  {/if}
</div>

<style global lang="scss">
  @import 'ImportFile.scss';
</style>
