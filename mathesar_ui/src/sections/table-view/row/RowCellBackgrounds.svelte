<script lang="ts">
  import CellBackground from './CellBackground.svelte';

  export let isSelected = false;
  export let isProcessing = false;
  export let hasErrors = false;
</script>

<CellBackground when={isSelected} color="var(--cell-bg-color-row-selected)" />
<CellBackground when={isProcessing} color="var(--cell-bg-color-processing)" />
<CellBackground when={hasErrors} color="var(--cell-bg-color-error)" />

<!--
  For perf, we pass the row hover state via CSS instead of JS. I didn't
  benchmark this. It's just a hunch that CSS will be faster than JS.
-->
<CellBackground
  class="cell-bg-row-hover"
  color="var(--cell-bg-color-row-hover, var(--cell-bg-color-base, white))"
/>
