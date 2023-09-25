<script lang="ts">
  import { active } from 'tinro';
  import {
    AnchorButton,
    Icon,
    Menu,
    MenuItemContents,
  } from '@mathesar-component-library';
  import {
    iconSettingsMajor,
    iconMultipleUsers,
    iconAddNew,
  } from '@mathesar/icons';
  import {
    ADD_DATABASE_CONNECTION_URL,
    ADMIN_UPDATE_PAGE_URL,
    ADMIN_USERS_PAGE_URL,
  } from '@mathesar/routes/urls';
  import { getReleaseDataStoreFromContext } from '@mathesar/stores/releases';

  const releaseDataStore = getReleaseDataStoreFromContext();

  $: upgradable = $releaseDataStore?.value?.upgradeStatus === 'upgradable';
</script>

<div class="admin-navigation">
  <div class="navigation-links">
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
          Update
        </MenuItemContents>
      </a>
      <a
        role="menuitem"
        href={ADMIN_USERS_PAGE_URL}
        class="menu-item menu-item-link"
        use:active
      >
        <MenuItemContents icon={iconMultipleUsers}>Users</MenuItemContents>
      </a>
    </Menu>
  </div>
  <hr />
  <div class="navigation-button">
    <AnchorButton href={ADD_DATABASE_CONNECTION_URL} appearance="plain-primary">
      <Icon {...iconAddNew} />
      <span>Add Database Connection</span>
    </AnchorButton>
  </div>
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
  hr {
    border: 0;
    border-top: var(--border-radius-xs) solid var(--brand-500);
  }
</style>
