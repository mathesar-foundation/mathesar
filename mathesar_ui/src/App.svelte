<style global lang="scss">
  @import "App.scss";
</style>

<script>
  import { Route, active } from 'tinro';
  import { schemas } from '@mathesar/api/schemas';
  import Index from '@mathesar/pages/index/Index.svelte';
  import Tables from '@mathesar/pages/tables/Tables.svelte';
  import { preloadCommonData } from '@mathesar/utils/preloadData';

  const commonData = preloadCommonData();
</script>

<header>
  <div class="dropdown">
    {#if commonData?.databases?.[0]}
      <div>{commonData?.databases?.[0]}</div>
    {/if}
  </div>
</header>

<aside>
  <nav>
    <ul>
      {#each $schemas.data as schema (schema.id)}
        <li>
          <div>{schema.name}</div>
          <ul>
            {#each (schema.tables || []) as table (table.id)}
              <li>
                <a href='/tables/{table.id}' use:active>{table.name}</a>
              </li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>

    <a href='/' use:active exact>Import CSV</a>
  </nav>
</aside>

<section>
  <Route path="/tables/:id">
    <Tables/>
  </Route>
  
  <Route path="/">
    <Index database={commonData?.databases?.[0]}/>
  </Route>  
</section>
