<!--
  @component

  Link to a page within Mathesar's user documentation published at
  https://docs.mathesar.org
-->
<script lang="ts">
  /** Should begin with a forward slash */
  export let path: string;

  $: href = `https://docs.mathesar.org${path}`;
</script>

<a {href} target="_blank">
  <slot />
</a>
