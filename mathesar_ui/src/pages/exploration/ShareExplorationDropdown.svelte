<script lang="ts">
  import { iconShare } from '@mathesar/icons';
  import type { QueryInstance } from '@mathesar/api/types/queries';
  import { Dropdown, Icon } from '@mathesar-component-library';
  import ShareEntity from '@mathesar/systems/shares/ShareEntity.svelte';
  import queryShareApi from '@mathesar/api/queryShares';

  export let id: QueryInstance['id'];
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
    api={queryShareApi}
    text={{
      header: 'Share Exploration',
      description:
        'Give read-only access to this exploration to anyone via a link.',
      empty: 'This exploration is currently not shared.',
    }}
  />
</Dropdown>
