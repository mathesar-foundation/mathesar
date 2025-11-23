<script lang="ts">
  // Intentionally loosened type to avoid cross-module private-field mismatch.
  // This minimal wrapper purposefully does not import/render ExplorationInspector
  // to avoid TypeScript trying to compare duplicate type declarations.
  export let queryHandler: any;
</script>

<section class="with-exploration-inspector">
  <!-- render only the default slot (main content). The inspector panel is omitted -->
  <slot />
</section>

<style>
  .with-exploration-inspector {
    display: contents;
  }
</style>
