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
  let section = 'roleConfiguration';

  export function setSection(_section: Section) {
    section = _section;
  }
</script>

<PageLayoutWithSidebar>
  <div class="navigation" slot="sidebar">
    <Menu>
      <MenuHeading>
        <div class="heading">{$_('in_mathesar')}</div>
      </MenuHeading>
      <LinkMenuItem
        href={getDatabaseRoleConfigurationUrl(database.id)}
        class={section === 'roleConfiguration' ? 'active' : ''}
      >
        {$_('role_configuration')}
      </LinkMenuItem>
      <LinkMenuItem
        href={getDatabaseCollaboratorsUrl(database.id)}
        class={section === 'collaborators' ? 'active' : ''}
      >
        {$_('collaborators')}
      </LinkMenuItem>
      <div class="menu-divider" />
      <MenuHeading>
        <div class="heading">{$_('on_the_server')}</div>
      </MenuHeading>
      <LinkMenuItem
        href={getDatabaseRolesUrl(database.id)}
        class={section === 'roles' ? 'active' : ''}
      >
        {$_('roles')}
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
    --Menu__item-border-radius: var(--border-radius-m);
    --Menu__item-hover-background: var(--sand-100);
    --Menu__item-active-background: var(--sand-200);
    --Menu__item-active-hover-background: var(--sand-200);
    --Menu__item-focus-outline-color: var(--sand-300);
    padding: var(--size-x-small) 0;

    .heading {
      font-size: var(--text-size-small);
      font-weight: 500;
      text-transform: uppercase;
      margin-bottom: var(--size-ultra-small);
    }
    .menu-divider {
      margin: 0.5rem 0.1rem 0.8rem 0.1rem;
    }
  }
</style>
