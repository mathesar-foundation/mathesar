<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    CommunityResource,
    DocumentationResource,
    DonateResource,
    MailingListResource,
  } from '@mathesar/components/resources';
  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
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
  <AppSecondaryHeader
    slot="secondary-header"
    name={$_(welcomeMessage)}
    icon={CommunityResource}
    --header-color="linear-gradient(
      135deg in hsl,
      var(--SYS-color-brand-15),
      var(--SYS-color-database-15),
      var(--SYS-color-schema-15),
      var(--SYS-color-table-15)
    )"
  />
  <div class="content">
    <div class="databases-section">
      <DatabasesList />
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

  .content {
    display: grid;
    gap: 3.5rem;
    grid-template-columns: 1fr;
    @media screen and (min-width: $breakpoint) {
      grid-template-columns: 1fr 20rem;
    }
  }
  .databases-section {
    grid-row: 1;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    @media screen and (min-width: $breakpoint) {
      grid-row: auto;
      grid-column: 1;
    }
  }
  .resources-sidebar {
    grid-row: 2;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    @media screen and (min-width: $breakpoint) {
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
