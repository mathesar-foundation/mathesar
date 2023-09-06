<script lang="ts">
  import { iconShare } from '@mathesar/icons';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import { Dropdown, Icon } from '@mathesar-component-library';
  import ShareEntity from '@mathesar/systems/shares/ShareEntity.svelte';
  import tableShareApi from '@mathesar/api/tableShares';
  import { getSharedTablePageUrl } from '@mathesar/routes/urls';

  export let id: TableEntry['id'];
</script>

<Dropdown
  showArrow={false}
  triggerAppearance="secondary"
  {...$$restProps}
  ariaLabel="Share"
>
  <svelte:fragment slot="trigger">
    <Icon {...iconShare} />
    <span class="responsive-button-label"> Share </span>
  </svelte:fragment>
  <ShareEntity
    slot="content"
    entityId={id}
    api={tableShareApi}
    text={{
      header: 'Share Table',
      description: 'Give read-only access to this table to anyone via a link.',
      empty: 'This table is currently not shared.',
    }}
    getLink={(share) => getSharedTablePageUrl(share.slug)}
  />
</Dropdown>
