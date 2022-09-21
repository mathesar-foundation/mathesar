<script lang="ts">
  import { Route } from 'tinro';
  import Observer from './Observer.svelte';

  export let path: string;
  export let firstmatch = false;
</script>

<Route {path} {firstmatch} let:meta>
  <Observer {meta} on:load on:unload />
  <slot {meta} />
</Route>
