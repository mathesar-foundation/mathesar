<script lang="ts">
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
  import BreadcrumbItem from './BreadcrumbItem.svelte';
  import {
    breadcrumbItemIsDatabase,
    getBreadcrumbItemsFromContext,
  } from './breadcrumbUtils';
  import LogoAndNameWithLink from './LogoAndNameWithLink.svelte';

  const items = getBreadcrumbItemsFromContext();

  $: isMinimal =
    $items.length === 0 || $items.every((i) => i.type === 'database');
  $: minimalHref = (() => {
    const fallback = '/';
    if (!isMinimal) {
      return fallback;
    }
    const databaseItem = $items.find(breadcrumbItemIsDatabase);
    const database = databaseItem?.database;
    if (!database) {
      return fallback;
    }
    return getDatabasePageUrl(database.name);
  })();
</script>

<div class="breadcrumb">
  {#if isMinimal}
    <LogoAndNameWithLink href={minimalHref} />
  {:else}
    {#each $items as item}
      <BreadcrumbItem {item} />
    {/each}
  {/if}
</div>

<style lang="scss">
  .breadcrumb {
    --breadcrumb-spacing: 0.75rem;
    display: flex;
    align-items: center;

    > :global(* + *) {
      margin-left: var(--breadcrumb-spacing);
    }
  }
</style>
