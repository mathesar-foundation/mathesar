<script lang="ts">
  import { _ } from 'svelte-i18n';

  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';

  import DatabasesList from './DatabasesList.svelte';
  import Resources from './Resources.svelte';

  const userProfileStore = getUserProfileStoreFromContext();
</script>

<svelte:head>
  <title>{makeSimplePageTitle($_('databases'))}</title>
</svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{
    '--page-padding': 'var(--inset-page-padding)',
    '--layout-background-color': 'var(--sand-100)',
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
  }}
>
  <h1>
    {$_('welcome_to_mathesar_user', {
      values: { user: $userProfileStore?.getDisplayName() },
    })}
  </h1>
  <div class="content">
    <DatabasesList />
    <Resources />
  </div>
</LayoutWithHeader>

<style lang="scss">
  .content {
    display: grid;
    gap: 2rem;
    @media screen and (min-width: 50rem) {
      grid-template: auto / 1fr 20rem;
    }
  }
</style>
