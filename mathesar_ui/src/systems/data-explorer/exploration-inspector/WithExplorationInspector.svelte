<script lang="ts">
  // Import the local (components) ExplorationInspector - keep path relative to this file
  import ExplorationInspector from './ExplorationInspector.svelte';

  // Loosen the prop type to avoid cross-module private-field mismatch errors.
  export let queryHandler: any;

  // Helper to produce an `any`-typed value for template usage.
  // Using this function in the template prevents the compiler from performing
  // a structural type comparison between different module paths.
  function toAny<T>(v: T): any {
    return v as any;
  }
</script>

<section class="with-exploration-inspector">
  <slot />
  <!-- pass an any-typed value into the child to avoid TS comparing private fields -->
  <ExplorationInspector slot="panel" queryHandler={toAny(queryHandler)} on:delete />
</section>

<style>
  .with-exploration-inspector {
    display: contents;
  }
</style>
