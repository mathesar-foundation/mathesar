<script lang="ts">
  import { Route } from 'tinro';
  import { setUserProfileStoreInContext } from '@mathesar/stores/userProfile';
  import { AnonymousViewerUserModel } from '@mathesar/stores/users';
  import SharedTableRoute from '@mathesar/routes/SharedTableRoute.svelte';

  setUserProfileStoreInContext(new AnonymousViewerUserModel());
</script>

<Route path="/tables/:slug/*" let:meta>
  <SharedTableRoute slug={String(meta.params.slug)} />
</Route>
