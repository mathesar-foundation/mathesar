<script lang="ts">
  import { _ } from 'svelte-i18n';

  import tableShareApi from '@mathesar/api/rest/tableShares';
  import type { Table } from '@mathesar/api/rpc/tables';
  import { iconShare } from '@mathesar/icons';
  import { getSharedTablePageUrl } from '@mathesar/routes/urls';
  import ShareEntity from '@mathesar/systems/shares/ShareEntity.svelte';
  import { Dropdown, Icon } from '@mathesar-component-library';

  export let id: Table['oid'];
</script>

<Dropdown
  showArrow={false}
  triggerAppearance="secondary"
  {...$$restProps}
  ariaLabel={$_('share')}
>
  <svelte:fragment slot="trigger">
    <Icon {...iconShare} />
    <span class="responsive-button-label">
      {$_('share')}
    </span>
  </svelte:fragment>
  <ShareEntity
    slot="content"
    entityId={id}
    api={tableShareApi}
    text={{
      header: $_('share_table'),
      description: $_('give_readonly_access_table_via_link'),
      empty: $_('table_not_shared'),
    }}
    getLink={(share) => getSharedTablePageUrl(share.slug)}
  />
</Dropdown>
