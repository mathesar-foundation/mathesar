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

  $: welcomeMessage = $_('welcome_to_mathesar_user', {
    values: { user: $userProfileStore?.getDisplayName() },
  });
</script>

<svelte:head>
  <title>{makeSimplePageTitle($_('databases'))}</title>
</svelte:head>

<LayoutWithHeader
  restrictWidth
  headerTitle={welcomeMessage}
  cssVariables={{
    '--page-padding': '0',
    '--layout-background-color': 'var(--sand-100)',
    '--layout-margin': '2rem 0',
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
  }}
>
  <div class="content">
    <div class="resources-sidebar">
      <h3>{$_('resources')}</h3>
      <div class="cards">
        <DocumentationResource />
        <CommunityResource />
        <MailingListResource />
        <DonateResource />
      </div>
    </div>
    <div class="databases-section">
      <DatabasesList />
    </div>
  </div>
</LayoutWithHeader>

<style lang="scss">
  .content {
    display: grid;
    gap: 3.5rem;
    @media screen and (min-width: 50rem) {
      grid-template: auto / 20rem 1fr;
    }
  }
  .databases-section {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }
  .resources-sidebar {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background-color: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
