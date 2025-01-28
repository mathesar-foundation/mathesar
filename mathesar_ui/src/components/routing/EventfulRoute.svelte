<script lang="ts">
  import { Route, type TinroRouteMeta } from 'tinro';

  import RouteObserver from './RouteObserver.svelte';

  export let path: string;
  export let firstmatch = false;
  export let onLoad: (metaInfo: TinroRouteMeta) => void = () => {};
  export let onUnload: () => void = () => {};
</script>

<Route {path} {firstmatch} let:meta>
  <RouteObserver {meta} {onLoad} {onUnload} />
  <slot {meta} />
</Route>
