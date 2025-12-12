<script lang="ts">
  import { onMount } from 'svelte';
  import type { TinroRouteMeta } from 'tinro';

  export let meta: TinroRouteMeta;
  export let onLoad: (metaInfo: TinroRouteMeta) => void = () => {};
  export let onUnload: () => void = () => {};

  onMount(() => {
    const unsubsriber = meta.subscribe((metaInfo) => {
      if (metaInfo) {
        onLoad(metaInfo);
      }
    });

    return () => {
      unsubsriber();
      onUnload();
    };
  });
</script>
