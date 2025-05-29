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
  cssVariables={{
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
  }}
>
  <div slot="secondary-header" class="home-page-header-title">
    <div class="home-page-header-title-inner">
      <h1>{welcomeMessage}</h1>
    </div>
  </div>
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

  .home-page-header-title {
    max-width: var(--max-layout-width);
    width: 100%;
    margin: var(--lg1) auto;
    padding: 0 var(--page-padding-x);
  }

  .home-page-header-title-inner {
    border: 1px solid var(--neutral-400);
    background: linear-gradient(
      135deg,
      var(--neutral-100) 0%,
      var(--neutral-200) 100%
    );
    padding: var(--sm4) var(--sm2);
    border-radius: var(--border-radius-l);
    font-weight: var(--font-weight-medium);
    box-shadow:
      0 4px 12px rgba(147, 142, 126, 0.15),
      0 2px 6px rgba(147, 142, 126, 0.1);

    h1 {
      margin: 0;
      color: var(--neutral-900);
      font-size: var(--text-size-base);
      font-weight: var(--font-weight-bold);
      text-shadow: none;
    }
  }

  :global(body.theme-dark) .home-page-header-title-inner {
    border: 1px solid var(--slate-600);
    background: linear-gradient(
      135deg,
      var(--slate-700) 0%,
      var(--slate-800) 100%
    );
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.4),
      0 2px 6px rgba(0, 0, 0, 0.3);

    h1 {
      color: var(--slate-50);
      font-weight: var(--font-weight-bold);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    }
  }

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
