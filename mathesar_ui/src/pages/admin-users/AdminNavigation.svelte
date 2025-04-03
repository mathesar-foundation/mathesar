<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { active } from 'tinro';

  import {
    iconMultipleUsers,
    iconSettingsMajor,
    iconSettingsMinor,
  } from '@mathesar/icons';
  import {
    ADMIN_SETTINGS_PAGE_URL,
    ADMIN_UPDATE_PAGE_URL,
    ADMIN_USERS_PAGE_URL,
  } from '@mathesar/routes/urls';
  import { getReleaseDataStoreFromContext } from '@mathesar/stores/releases';
  import { Menu, MenuItemContents } from '@mathesar-component-library';

  const releaseDataStore = getReleaseDataStoreFromContext();

  $: upgradable = $releaseDataStore?.value?.upgradeStatus === 'upgradable';
</script>

<div class="admin-navigation">
  <Menu>
    <a
      role="menuitem"
      href={ADMIN_UPDATE_PAGE_URL}
      class="menu-item menu-item-link"
      use:active
    >
      <MenuItemContents
        icon={iconSettingsMajor}
        hasNotificationDot={upgradable}
      >
        {$_('update')}
      </MenuItemContents>
    </a>
    <a
      role="menuitem"
      href={ADMIN_USERS_PAGE_URL}
      class="menu-item menu-item-link"
      use:active
    >
      <MenuItemContents icon={iconMultipleUsers}>
        {$_('users')}
      </MenuItemContents>
    </a>
    <a
      role="menuitem"
      href={ADMIN_SETTINGS_PAGE_URL}
      class="menu-item menu-item-link"
      use:active
    >
      <MenuItemContents icon={iconSettingsMinor}>
        {$_('settings')}
      </MenuItemContents>
    </a>
  </Menu>
</div>

<style lang="scss">
  .admin-navigation {
    font-size: var(--text-size-base);
    --Menu__min-width: 100%;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-m);
    overflow: hidden;
  }
</style>
