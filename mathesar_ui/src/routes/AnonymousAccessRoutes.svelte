<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
</script>

<Route path="/">
  <ErrorPage>{$_('page_doesnt_exist')}</ErrorPage>
</Route>
