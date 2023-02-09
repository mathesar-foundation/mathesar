<script lang="ts">
  import InsetPageSection from '@mathesar/components/InsetPageSection.svelte';

  export let hasMultipleSections = false;
</script>

<div class="inset-page-layout">
  <div class="header restrict-width"><slot name="header" /></div>
  <div class="page restrict-width">
    {#if hasMultipleSections}
      <slot />
    {:else}
      <InsetPageSection>
        <slot />
      </InsetPageSection>
    {/if}
  </div>
</div>

<style lang="scss">
  .inset-page-layout {
    background: var(--sand-200);
    padding: var(--inset-layout-padding, 1.5rem 1rem);

    :global(.inset-page-section + .inset-page-section) {
      margin-top: 1.4rem;
    }
  }
  .restrict-width {
    max-width: var(--max-layout-width, 54rem);
    margin-left: auto;
    margin-right: auto;
    width: 100%;
  }
</style>
