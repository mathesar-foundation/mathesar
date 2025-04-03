<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { DatabaseSettingsRouteContext } from '@mathesar/contexts/DatabaseSettingsRouteContext';
  import PageLayoutWithSidebar from '@mathesar/layouts/PageLayoutWithSidebar.svelte';
  import {
    getDatabaseCollaboratorsUrl,
    getDatabaseRoleConfigurationUrl,
    getDatabaseRolesUrl,
  } from '@mathesar/routes/urls';
  import { LinkMenuItem, Menu, MenuHeading } from '@mathesar-component-library';

  const databaseSettingsContext = DatabaseSettingsRouteContext.get();
  $: ({ database } = $databaseSettingsContext);

  type Section = 'roleConfiguration' | 'collaborators' | 'roles';
  let section = 'roles';

  export function setSection(_section: Section) {
    section = _section;
  }
</script>

<PageLayoutWithSidebar>
  <div class="navigation" slot="sidebar">
    <Menu>
      <MenuHeading>
        <div class="heading">{$_('in_postgresql')}</div>
      </MenuHeading>
      <LinkMenuItem
        href={getDatabaseRolesUrl(database.id)}
        class={section === 'roles' ? 'active' : ''}
      >
        {$_('roles')}
      </LinkMenuItem>

      <div class="menu-divider" />

      <MenuHeading>
        <div class="heading">{$_('in_mathesar')}</div>
      </MenuHeading>
      <LinkMenuItem
        href={getDatabaseRoleConfigurationUrl(database.id)}
        class={section === 'roleConfiguration' ? 'active' : ''}
      >
        {$_('stored_role_passwords')}
      </LinkMenuItem>
      <LinkMenuItem
        href={getDatabaseCollaboratorsUrl(database.id)}
        class={section === 'collaborators' ? 'active' : ''}
      >
        {$_('collaborators')}
      </LinkMenuItem>
    </Menu>
  </div>
  <div>
    <slot {setSection} />
  </div>
</PageLayoutWithSidebar>

<style lang="scss">
  .navigation {
    --Menu__min-width: 100%;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-m);
    overflow: hidden;
  }
</style>
