<script lang="ts">
  import { active } from 'tinro';

  import { Icon } from '@mathesar-component-library';
  import { iconSettingsMajor, iconUser } from '@mathesar/icons';
  import {
    ADMIN_UPDATE_PAGE_URL,
    ADMIN_USERS_PAGE_URL,
  } from '@mathesar/routes/urls';
  import { getReleaseDataStoreFromContext } from '@mathesar/stores/releases';

  const releaseDataStore = getReleaseDataStoreFromContext();

  $: upgradable = $releaseDataStore?.value?.upgradeStatus === 'upgradable';
</script>

<ul role="menu" class="admin-navigation-menu">
  <li role="menuitem">
    <a href={ADMIN_UPDATE_PAGE_URL} use:active class="passthrough">
      <Icon {...iconSettingsMajor} hasNotificationDot={upgradable} />
      <span>Update</span>
    </a>
  </li>
  <li role="menuitem">
    <a href={ADMIN_USERS_PAGE_URL} use:active class="passthrough">
      <Icon {...iconUser} />
      <span>Users</span>
    </a>
  </li>
</ul>

<style lang="scss">
  .admin-navigation-menu {
    list-style-type: none;
    padding-right: 1rem;
    padding-left: 0;

    li {
      font-size: var(--text-size-large);
      margin-top: 0.15rem;
      position: relative;
    }

    a {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      border-radius: var(--border-radius-m);
      cursor: pointer;

      > :global(* + *) {
        margin-left: 0.5rem;
      }

      &:hover {
        background-color: var(--sand-200);
      }

      &:global(.active) {
        background-color: var(--sand-200);
      }
    }
  }
</style>
