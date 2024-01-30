<!--
  @component

  @deprecated in favor of components in @mathesar/components/grid-form which
  have looser coupling with the form validation system.
-->
<script lang="ts">
  export let bypass = false;
</script>

{#if bypass}
  <slot />
{:else}
  <div class="input-row" style="display:contents;">
    <slot />
  </div>
{/if}

<style lang="scss">
  .input-row + :global(.input-row .cell) {
    margin-top: var(--size-large);
  }
  .input-row :global(.right + .left) {
    padding-left: var(--size-base);
  }
</style>
