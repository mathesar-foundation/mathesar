<script>
  import { Icon } from '@mathesar/component-library';
  import { iconSettingsMajor, iconUser } from '@mathesar/icons';
  import { active } from 'tinro';
  import {
    ADMIN_GENERAL_PAGE_URL,
    ADMIN_USERS_PAGE_URL,
  } from '@mathesar/routes/urls';
</script>

<ul role="menu" class="admin-navigation-menu">
  <li>
    <a href={ADMIN_GENERAL_PAGE_URL} use:active class="passthrough">
      <Icon {...iconSettingsMajor} />
      <span>General</span>
    </a>
  </li>
  <li>
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

    > :global(* + *) {
      margin-top: 0.15rem;
    }

    a {
      display: flex;
      align-items: center;
      padding: 0.57rem;
      border-radius: var(--border-radius-m);
      font-size: var(--text-size-large);
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
