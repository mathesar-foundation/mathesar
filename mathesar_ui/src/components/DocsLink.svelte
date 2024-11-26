<!--
  @component

  Link to a page within Mathesar's user documentation published at
  https://docs.mathesar.org
-->
<script lang="ts">
  import { getDocsLink } from '@mathesar/routes/urls';

  /**
   * - Should begin with a forward slash
   * - Should **not** include the base URL
   * - Should **not** include the `.md` extension
   * - Should **not** include the language prefix
   *
   * Example: `/user-guide/references/`
   */
  export let path: string;

  $: href = getDocsLink(path);
</script>

<a {href} target="_blank">
  <slot />
</a>
