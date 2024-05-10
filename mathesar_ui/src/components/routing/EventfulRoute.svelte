<script lang="ts">
  import { Route } from 'tinro';

  import RouteObserver from './RouteObserver.svelte';

  export let path: string;
  export let firstmatch = false;
</script>

<Route {path} {firstmatch} let:meta>
  <RouteObserver {meta} on:load on:unload />
  <slot {meta} />
</Route>
