<script lang="ts">
  import type { LinkType } from '../linkTableUtils';

  const rect = { width: '47.07', height: '18.31', rx: 9.157 };

  export let linkType: LinkType;

  $: flip = linkType === 'manyToOne';
</script>

<svg viewBox="0 0 188 127" preserveAspectRatio="xMidYMid meet" class:flip>
  {#if linkType === 'manyToMany'}
    <path d="m94 54.37c0-17.95 28.67-7.609 28.67-26.1" class="line" />
    <path d="m163.4 54.34c0-17.95-28.67-7.579-28.67-26.07" class="line" />
    <path d="m24.65 72.63c0 17.95 28.67 7.609 28.67 26.1" class="line" />
    <path d="m94 72.66c0 17.95-28.67 7.579-28.67 26.07" class="line" />
    <path d="m24.65 54.34c0-17.95 28.67-7.609 28.67-26.1" class="line" />
    <path d="m163.4 72.66c0 17.95-28.67 7.579-28.67 26.07" class="line" />
    <path d="m53.32 106.9 4.172-8.213h-8.344z" class="arrow" />
    <path d="m65.33 106.9 4.172-8.213h-8.344z" class="arrow" />
    <path d="m134.7 106.9 4.172-8.213h-8.344z" class="arrow" />
    <path d="m122.7 20.06 4.172 8.213h-8.344z" class="arrow" />
    <path d="m134.7 20.06 4.172 8.213h-8.344z" class="arrow" />
    <path d="m53.32 20.03 4.172 8.213h-8.344z" class="arrow" />
    <rect {...rect} class="target" x="105.1" y="107.4" />
    <rect {...rect} class="target" x="35.79" y="107.4" />
    <rect {...rect} class="mapping" x="139.8" y="54.34" />
    <rect {...rect} class="mapping" x="70.46" y="54.34" />
    <rect {...rect} class="mapping" x="1.112" y="54.34" />
    <rect {...rect} class="base" x="105.1" y="1.25" />
    <rect {...rect} class="base" x="35.79" y="1.25" />
  {:else}
    <path d="m88 28.26c-4e-6 46.95-42.67 33.06-42.67 79.17" class="line" />
    <path d="m100 28.26c1e-5 46.95 42.67 33.06 42.67 79.17" class="line" />
    <path d="m88 20.05 4.172 8.213h-8.344z" class="arrow" />
    <path d="m100 20.05 4.172 8.213h-8.344z" class="arrow" />
    <rect {...rect} class="target" x="21.79" y="107.4" />
    <rect {...rect} class="target" x="119.1" y="107.4" />
    <rect {...rect} class="base" x="70.46" y="1.236" />
  {/if}
</svg>

<style>
  svg {
    height: 100%;
    width: 100%;
    color: var(--slate-500);
  }
  svg.flip {
    transform: scaleY(-1);
  }
  .base {
    fill: var(--base-fill);
    stroke: var(--base-stroke);
  }
  svg.flip .base {
    fill: var(--target-fill);
    stroke: var(--target-stroke);
  }
  .mapping {
    fill: var(--mapping-fill);
    stroke: var(--mapping-stroke);
  }
  .target {
    fill: var(--target-fill);
    stroke: var(--target-stroke);
  }
  svg.flip .target {
    fill: var(--base-fill);
    stroke: var(--base-stroke);
  }
  .line {
    fill: none;
    stroke: currentcolor;
    stroke-width: 2;
  }
  .arrow {
    fill: currentcolor;
    stroke: none;
  }
</style>
