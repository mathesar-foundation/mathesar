<script lang="ts">
  import { Route } from 'tinro';
  import SharedTableRoute from '@mathesar/routes/SharedTableRoute.svelte';
  import SharedExplorationRoute from '@mathesar/routes/SharedExplorationRoute.svelte';
</script>

<Route path="/tables/:slug/*" let:meta>
  <SharedTableRoute slug={String(meta.params.slug)} />
</Route>

<Route path="/explorations/:slug/*" let:meta>
  <SharedExplorationRoute slug={String(meta.params.slug)} />
</Route>
