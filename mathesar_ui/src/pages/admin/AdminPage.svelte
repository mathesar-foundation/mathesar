<script lang="ts">
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import {
    ADMIN_GENERAL_PAGE_URL,
    ADMIN_USERS_PAGE_URL,
  } from '@mathesar/routes/urls';

  export let section: string;
</script>

<LayoutWithHeader>
  <h1>Administration page</h1>
  <div>
    <a href={ADMIN_GENERAL_PAGE_URL}>Goto general</a>
    <a href={ADMIN_USERS_PAGE_URL}>Goto users</a>
  </div>
  <h2>
    Current tab: {section}
  </h2>
</LayoutWithHeader>
