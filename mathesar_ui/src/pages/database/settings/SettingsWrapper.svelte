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
    --Menu__item-border-radius: var(--border-radius-m);
    --Menu__item-hover-background: var(--sand-100);
    --Menu__item-active-background: var(--sand-200);
    --Menu__item-active-hover-background: var(--sand-200);
    --Menu__item-focus-outline-color: var(--sand-300);
    padding: var(--size-x-small) 0;

    .heading {
      color: var(--slate-400);
      font-weight: 500;
      margin-bottom: var(--size-ultra-small);
    }
    .menu-divider {
      margin: 1rem 0;
    }
  }
</style>
