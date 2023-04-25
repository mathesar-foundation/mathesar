<script lang="ts">
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

<Menu style="--min-width:100%;font-size: var(--text-size-large);">
  <a
    role="menuitem"
    href={ADMIN_UPDATE_PAGE_URL}
    class="menu-item menu-item-link"
    use:active
  >
    <MenuItemContents icon={iconSettingsMajor} hasNotificationDot={upgradable}>
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

<style lang="scss">
  a {
    border-radius: var(--border-radius-m);

    &:global(.active) {
      --Menu__item-background: var(--sand-200);
      --Menu__item-hover-background: var(--sand-200);
    }
    &:global(:not(.active)) {
      --Menu__item-hover-background: var(--sand-100);
    }
  }
</style>
