<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { active } from 'tinro';
  import { Menu, MenuItemContents } from '@mathesar-component-library';
  import { iconSettingsMajor, iconMultipleUsers } from '@mathesar/icons';
  import {
    ADMIN_UPDATE_PAGE_URL,
    ADMIN_USERS_PAGE_URL,
  } from '@mathesar/routes/urls';
  import { getReleaseDataStoreFromContext } from '@mathesar/stores/releases';

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
  </Menu>
</div>

<style lang="scss">
  .admin-navigation {
    font-size: var(--text-size-base);
    --min-width: 100%;
    --Menu__item-border-radius: var(--border-radius-m);
    --Menu__item-hover-background: var(--sand-100);
    --Menu__item-active-background: var(--sand-200);
    --Menu__item-active-hover-background: var(--sand-200);
    --Menu__item-focus-outline-color: var(--sand-300);
  }
</style>
