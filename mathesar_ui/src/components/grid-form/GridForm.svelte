<script lang="ts">
  /** When the form is wider than this, it will display in a grid. When it's
   * narrower, it will display vertically */
  export let breakpointPx = 400;

  let width: number;
</script>

<div
  class="grid-form"
  bind:clientWidth={width}
  class:grid={width > breakpointPx}
>
  <slot />
</div>

<style>
  .grid-form:not(.grid) > :global(* + *) {
    margin-top: 1rem;
  }
  .grid-form:not(.grid) > :global(.divider + .divider) {
    display: none;
  }

  .grid-form:not(.grid) > :global(:nth-child(even)) {
    margin-left: 1rem;
    margin-bottom: 2rem;
  }

  .grid-form.grid {
    display: grid;
    grid-template-columns: fit-content(30%) 1fr;
    gap: 1.5rem 0;
  }

  .grid-form.grid > :global(:nth-child(odd)) {
    text-align: right;
    padding-right: 1rem;
  }
</style>
