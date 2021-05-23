<script lang="ts">
  import { Route, active } from 'tinro';
  import { schemas } from '@mathesar/api/schemas';
  import { preloadCommonData } from '@mathesar/utils/preloadData';
  import type { Schema } from '@mathesar/utils/preloadData';
  import {
    openTable,
    isInTableContentView,
    getTableQuery,
  } from '@mathesar/utils/routeHandler';
  import { Tree } from '@mathesar-components';
  import ImportFile from '@mathesar/pages/import-file/ImportFile.svelte';

  const commonData = preloadCommonData();
  const selectedDb = commonData?.databases?.[0];

  function getLink(entry: Schema, level: number) {
    if (level === 0) {
      return null;
    }
    return `/${selectedDb}/content?${getTableQuery(entry.id)}`;
  }

  function tableSelected(e: { detail: { entry: Schema, originalEvent: Event, link?: string } }) {
    const { entry, originalEvent, link } = e.detail;
    if (link && isInTableContentView(selectedDb)) {
      const { parentElement } = originalEvent.target as Element;
      originalEvent.preventDefault();
      originalEvent.stopPropagation();
      openTable(selectedDb, entry.id);
      parentElement?.click();
    }
  }
</script>

<header>
  <div class="dropdown">
    {#if selectedDb}
      <div>{selectedDb}</div>
    {/if}
  </div>
  <a href='/import' use:active data-exact>Import CSV</a>
</header>

<aside>
  <nav>
    <Tree data={$schemas.data} idKey="id" labelKey="name" childKey="tables" {getLink} on:nodeSelected={tableSelected}/>
  </nav>
</aside>

<section>
  <Route path="/:db/content">
    Table route
  </Route>

  <Route path="/" redirect="/{selectedDb}/content"/>

  <Route path="/import">
    <ImportFile database={selectedDb}/>
  </Route>
</section>

<style global lang="scss">
  @import "App.scss";
</style>
