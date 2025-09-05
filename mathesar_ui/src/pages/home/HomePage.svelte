<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import {
    CommunityResource,
    DocumentationResource,
    DonateResource,
    MailingListResource,
  } from '@mathesar/components/resources';
  import RecentsFavorites from '@mathesar/components/favorites/RecentsFavorites.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';

  import DatabasesList from './DatabasesList.svelte';

  const userProfileStore = getUserProfileStoreFromContext();

  $: welcomeMessage = $_('welcome_to_mathesar_user', {
    values: { user: $userProfileStore?.getDisplayName() },
  });
</script>

<svelte:head>
  <title>{makeSimplePageTitle($_('databases'))}</title>
</svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
  }}
>
  <div slot="secondary-header" class="home-page-header-title">
    <div class="home-page-header-title-inner">
      {welcomeMessage}
    </div>
  </div>
  <div class="content">
    <div class="main-section">
      <RecentsFavorites />
      <div class="databases-section">
        <DatabasesList />
      </div>
    </div>
    <div class="resources-sidebar">
      <h2>{$_('resources')}</h2>
      <div class="cards">
        <DocumentationResource />
        <CommunityResource />
        <MailingListResource />
        <DonateResource />
      </div>
    </div>
  </div>
</LayoutWithHeader>

<style lang="scss">
  $breakpoint: 50rem;

  .home-page-header-title {
    max-width: var(--max-layout-width);
    width: 100%;
    margin: var(--lg1) auto;
    padding: 0 var(--page-padding-x);
  }

  .content {
    display: grid;
    gap: 3.5rem;
    grid-template-columns: 1fr;
    @media screen and (min-width: 60rem) {
      grid-template-columns: 1fr 20rem;
    }
  }

  .main-section {
    grid-row: 1;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    @media screen and (min-width: 60rem) {
      grid-row: auto;
      grid-column: 1;
    }
  }

  .databases-section {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  .resources-sidebar {
    grid-row: 2;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    @media screen and (min-width: 60rem) {
      grid-row: auto;
      grid-column: 2;
    }
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    & > :global(*) {
      width: 100%;
    }
  }
</style>
