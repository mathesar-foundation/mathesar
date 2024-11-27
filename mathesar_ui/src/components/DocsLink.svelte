<!--
  @component

  Link to a page within Mathesar's user documentation published at
  https://docs.mathesar.org
-->
<script lang="ts">
  import { getDocsLink } from '@mathesar/routes/urls';

  const pages = {
    import: '/user-guide/importing-data/',
    relationships: '/user-guide/relationships/',
  };
  type Page = keyof typeof pages;

  export let page: Page;

  $: href = getDocsLink(pages[page]);
</script>

<a {href} target="_blank">
  <slot />
</a>
