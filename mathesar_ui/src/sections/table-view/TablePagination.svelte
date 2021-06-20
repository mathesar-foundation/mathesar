<script lang="ts">
  import { Pagination } from '@mathesar-components';

  export let total: number;
  export let pageSize: number;
  export let page: number;
  export let offset = 0;

  $: offset = (pageSize * (page - 1)) + 1;
  $: max = Math.min(total, offset + pageSize - 1);

  let pageCount: number;
</script>

{#if pageCount > 0}
  Showing {offset} - {max} of {total}
{/if}

<Pagination total={total} pageSize={pageSize}
  bind:page={page} bind:pageCount on:pageChanged/>
