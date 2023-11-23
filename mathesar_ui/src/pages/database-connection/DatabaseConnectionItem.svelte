<script lang="ts">
  import type { Database } from '@mathesar/AppTypes';
  import { Icon } from '@mathesar/component-library';
  import { iconEdit } from '@mathesar/icons';
  import { getDatabaseConnectionEditUrl } from '@mathesar/routes/urls';

  export let database: Database;
</script>

<a
  class="connection-item passthrough"
  href={getDatabaseConnectionEditUrl(database.nickname)}
>
  <span class="floating-icon">
    <Icon {...iconEdit} />
  </span>
  <div class="connection-details">
    <p class="connection-name">{database.nickname}</p>
    <p class="db-name">{database.db_name}</p>
  </div>
</a>

<style lang="scss">
  .connection-item {
    position: relative;
    display: flex;

    padding: var(--size-base);

    &:not([aria-disabled='true']) {
      cursor: pointer;
    }

    &:hover:not([aria-disabled='true']) {
      background: var(--slate-50);
    }
    &:focus:not([aria-disabled='true']) {
      background: var(--slate-100);
    }

    .connection-details {
      display: flex;
      flex-direction: column;

      > :global(* + *) {
        margin-top: var(--size-xx-small);
      }
    }
  }

  .floating-icon {
    position: absolute;
    top: var(--size-base);
    right: var(--size-base);
  }

  .db-name {
    color: var(--slate-500);
    font-size: var(--text-size-small);
  }

  p {
    margin: 0;
  }
</style>
