<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { FileManifestWithRequestParams } from './fileUtils';

  export let fileManifestWithRequestParams: FileManifestWithRequestParams;

  $: ({ name, uri, mimetype, showFileStorageInfo } =
    fileManifestWithRequestParams);
</script>

<table>
  <tr><th>{$_('name')}</th><td>{name}</td></tr>
  {#if showFileStorageInfo}
    <tr><th>{$_('storage_uri')}</th><td>{uri}</td></tr>
  {/if}
  <tr><th>{$_('mime_type')}</th><td>{mimetype}</td></tr>
</table>

<style lang="scss">
  table {
    max-width: max-content;

    th {
      text-align: right;
      min-width: max-content;
      white-space: nowrap;
      vertical-align: top;
    }
    td {
      line-height: 1.2;
      padding: 0.2em 0.8em;
      word-break: break-all;
      overflow-wrap: anywhere;
    }
  }
</style>
