<!--
  @component

  Link to a page within Mathesar's user documentation published at
  https://docs.mathesar.org
-->
<script lang="ts">
  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import { iconExternalHyperlink } from '@mathesar/icons';
  import { type DocsPage, getDocsLink } from '@mathesar/routes/urls';

  export let page: DocsPage;
</script>

<a href={getDocsLink(page)} target="_blank">
  <slot />
  <Icon {...iconExternalHyperlink} />
</a>
