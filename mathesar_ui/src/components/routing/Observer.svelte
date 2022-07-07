<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TinroRouteMeta } from 'tinro';

  const dispatch = createEventDispatcher<{ routeUpdated: TinroRouteMeta }>();

  export let meta: TinroRouteMeta;

  $: dispatch('routeUpdated', $meta);
</script>
