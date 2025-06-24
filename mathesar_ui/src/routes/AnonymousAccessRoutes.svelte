<script lang="ts">
  import { Route } from 'tinro';

  import SharedTableRoute from '@mathesar/routes/SharedTableRoute.svelte';
</script>

<Route path="/tables/:slug/*" let:meta>
  <SharedTableRoute slug={String(meta.params.slug)} />
</Route>
