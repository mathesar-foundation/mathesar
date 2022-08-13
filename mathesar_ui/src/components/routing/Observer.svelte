<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { TinroRouteMeta } from 'tinro';

  const dispatch = createEventDispatcher<{
    routeUpdated: TinroRouteMeta;
    routeLoaded: TinroRouteMeta;
  }>();

  export let meta: TinroRouteMeta;

  $: if ($meta) {
    dispatch('routeUpdated', $meta);
  }

  onMount(() => {
    dispatch('routeLoaded', $meta);
  });
</script>
