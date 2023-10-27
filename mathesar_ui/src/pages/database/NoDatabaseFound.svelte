<script lang="ts">
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import PageLayoutWithSidebar from '@mathesar/layouts/PageLayoutWithSidebar.svelte';
  import { AnchorButton, Tutorial } from '@mathesar/component-library';
  import { DATABASE_CONNECTION_ADD_URL } from '@mathesar/routes/urls';
  import DatabaseNavigationList from './DatabaseNavigationList.svelte';
</script>

<LayoutWithHeader
  restrictWidth={true}
  cssVariables={{
    '--layout-background-color': 'var(--sand-100)',
    '--max-layout-width': 'var(--max-layout-width-console-pages)',
    '--PageLayoutWithSidebar__gap': 'var(--size-ultra-large)',
    '--AppSecondaryHeader__padding': 'var(--size-x-large) 0',
  }}
>
  <PageLayoutWithSidebar>
    <DatabaseNavigationList slot="sidebar" />
    <Tutorial>
      <span slot="title"> No Databases Found </span>
      <span slot="body">
        Looks like you don't have any databases set up. You'll need to connect
        to a database to start using Mathesar.
      </span>
      <AnchorButton
        appearance="primary"
        slot="footer"
        href={DATABASE_CONNECTION_ADD_URL}
      >
        Add Database Connection
      </AnchorButton>
    </Tutorial>
  </PageLayoutWithSidebar>
</LayoutWithHeader>
