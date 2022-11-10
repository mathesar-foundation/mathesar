<script lang="ts">
  export let when = true;
  /**
   * This can be any string which is valid for the CSS `background-color`
   * property. CSS variables are okay. Colors should be opaque because they will
   * be blended via the `mix-blend-mode`.
   */
  export let color: string;
  let classes = '';
  export { classes as class };
</script>

{#if when}
  <div
    class={`cell-background ${classes}`}
    style={`background-color: ${color};`}
  />
{/if}

<style>
  .cell-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    mix-blend-mode: var(--cell-bg-mix-blend-mode, multiply);
  }
</style>
