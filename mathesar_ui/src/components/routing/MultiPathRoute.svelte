<script lang="ts">
  import { tick } from 'svelte';
  import type { TinroRouteMeta } from 'tinro';
  import EventfulRoute from './EventfulRoute.svelte';
  import type { RoutePath } from './utils';

  export let paths: RoutePath[];

  let currentPath:
    | {
        routePath: RoutePath;
        meta: TinroRouteMeta;
      }
    | undefined;

  function setPath(path: RoutePath, _meta: TinroRouteMeta) {
    currentPath = {
      routePath: path,
      meta: _meta,
    };
  }

  async function clearPath(path: RoutePath) {
    /**
     * This is important.
     * This function body should only execute after a tick,
     * once the next path without paths is loaded.
     */
    await tick();
    if (currentPath?.routePath === path) {
      currentPath = undefined;
    }
  }
</script>

{#each paths as rp (rp.name)}
  <EventfulRoute
    path={rp.path}
    on:load={(e) => setPath(rp, e.detail)}
    on:unload={() => clearPath(rp)}
    firstmatch
  />
{/each}

{#if currentPath}
  <slot meta={currentPath.meta} path={currentPath.routePath.name} />
{/if}
