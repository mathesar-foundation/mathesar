<!--
  @component

  Link to a page within Mathesar's user documentation published at
  https://docs.mathesar.org
-->
<script lang="ts">
  import { getDocsLink } from '@mathesar/routes/urls';

  const pages = {
    // TODO_BETA: Add correct link to analytics information docs-page/website
    analytics: '/analytics/',
    import: '/user-guide/importing-data/',
    relationships: '/user-guide/relationships/',
    roles: '/user-guide/roles/',
    rolesLogin: '/user-guide/roles/#login',
    rolesInheritance: '/user-guide/roles/#inheritance',
    storedRolePasswords: '/user-guide/stored-role-passwords/',
    collaborators: '/user-guide/collaborators/',
    internalSchemas: '/user-guide/schemas/#internal',
    databases: '/user-guide/databases/',
    databasePermissions: '/user-guide/databases/#permissions',
    schemaPermissions: '/user-guide/schemas/#permissions',
    tablePermissions: '/user-guide/tables/#permissions',
    schemas: '/user-guide/schemas/',
    userAdmin: '/user-guide/users/#admin',
    dataTypes: '/user-guide/data-types/',
  };
  type Page = keyof typeof pages;

  export let page: Page;

  $: href = getDocsLink(pages[page]);
</script>

<a {href} target="_blank">
  <slot />
</a>
