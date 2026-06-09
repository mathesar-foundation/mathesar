<script lang="ts">
  import { onMount } from 'svelte';
  import type { TinroRouteMeta } from 'tinro';

  export let meta: TinroRouteMeta;
  export let onLoad: (metaInfo: TinroRouteMeta) => void = () => {};
  export let onUnload: () => void = () => {};
  export let onLoadAlways: () => void = () => {};

  onMount(() => {
    if (!meta.subscribe) {
      onLoadAlways();
    }
    const unsubscriber = meta.subscribe?.((metaInfo) => {
      onLoadAlways();
      if (metaInfo) {
        onLoad(metaInfo);
      }
    });

    return () => {
      unsubscriber?.();
      onUnload();
    };
  });
</script>
