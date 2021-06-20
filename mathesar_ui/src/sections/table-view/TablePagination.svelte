<script lang="ts">
  import { Pagination } from '@mathesar-components';
  import URLQueryHandler from '@mathesar/utils/urlQueryHandler';

  export let database: string;
  export let id: number;
  export let total: number;
  export let pageSize: number;
  export let page: number;
  export let offset = 0;

  $: offset = (pageSize * (page - 1)) + 1;
  $: max = Math.min(total, offset + pageSize - 1);

  let pageCount: number;

  function getLink(_page: number, _pageSize: number): string {
    return `/${database}${URLQueryHandler.constructTableQuery(id, {
      pageSize: _pageSize,
      page: _page,
    })}`;
  }
</script>

{#if pageCount > 0}
  Showing {offset} - {max} of {total}
{/if}

<Pagination total={total} pageSize={pageSize} {getLink}
  bind:page={page} bind:pageCount on:pageChanged/>
