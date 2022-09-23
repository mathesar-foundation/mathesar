<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { TinroRouteMeta } from 'tinro';

  const dispatch = createEventDispatcher<{
    load: TinroRouteMeta;
    update: TinroRouteMeta;
    unload: undefined;
  }>();

  export let meta: TinroRouteMeta;

  onMount(() => {
    const unsubsriber = $meta.subscribe((metaInfo) => {
      if (metaInfo) {
        dispatch('load', metaInfo);
      }
    });

    return () => {
      unsubsriber();
      dispatch('unload');
    };
  });
</script>
