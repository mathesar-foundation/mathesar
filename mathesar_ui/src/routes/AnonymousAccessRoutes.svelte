<script lang="ts">
  import { Route } from 'tinro';
  import { setUserProfileStoreInContext } from '@mathesar/stores/userProfile';
  import { AnonymousViewerUserModel } from '@mathesar/stores/users';
  import SharedTableRoute from '@mathesar/routes/SharedTableRoute.svelte';
  import SharedExplorationRoute from '@mathesar/routes/SharedExplorationRoute.svelte';

  setUserProfileStoreInContext(new AnonymousViewerUserModel());
</script>

<Route path="/tables/:slug/*" let:meta>
  <SharedTableRoute slug={String(meta.params.slug)} />
</Route>

<Route path="/explorations/:slug/*" let:meta>
  <SharedExplorationRoute slug={String(meta.params.slug)} />
</Route>
