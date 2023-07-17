<script lang="ts">
  import DocsLink from '@mathesar/components/DocsLink.svelte';
</script>

<div class="upload-format-help">
  The data must be in tabular format (CSV, TSV etc) or JSON. See relevant
  <DocsLink path="/user-guide/importing-data/">documentation</DocsLink>.
</div>

<style>
  .upload-format-help {
    line-height: 1.2;
    color: var(--slate-500);
    text-align: right;
    font-size: var(--text-size-small);
  }
</style>
