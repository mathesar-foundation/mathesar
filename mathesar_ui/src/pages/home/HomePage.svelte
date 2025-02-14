<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    CommunityResource,
    DocumentationResource,
    DonateResource,
    MailingListResource,
  } from '@mathesar/components/resources';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';

  import DatabasesList from './DatabasesList.svelte';

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
    <div class="databases-section">
      <DatabasesList />
    </div>
    <div class="resources">
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
  .content {
    display: grid;
    gap: 2rem;
    @media screen and (min-width: 50rem) {
      grid-template: auto / 1fr 20rem;
    }
  }
  .databases-section {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }
  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;

    & > :global(*) {
      flex: 1 0 15rem;
    }
  }
</style>
