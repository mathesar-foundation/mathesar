<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Database } from '@mathesar/api/rpc/databases';
  import { iconConnection } from '@mathesar/icons';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
  import { Icon } from '@mathesar-component-library';

  export let database: Database;
</script>

<tr data-identifier="connection-row" class="grid-row">
  <td>
    <a href={getDatabasePageUrl(database.id)}>
      <Icon {...iconConnection} />
      {database.name}
    </a>
  </td>
</tr>

<style lang="scss">
  [data-identifier='connection-row'] {
    td {
      padding: var(--size-base);
    }
  }
</style>
