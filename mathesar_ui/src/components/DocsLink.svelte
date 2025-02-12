<!--
  @component

  Link to a page within Mathesar's user documentation published at
  https://docs.mathesar.org
-->
<script lang="ts">
  import { type DocsPage, getDocsLink } from '@mathesar/routes/urls';

  export let page: DocsPage;
</script>

<a href={getDocsLink(page)} target="_blank">
  <slot />
</a>
