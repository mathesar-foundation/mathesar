<script lang="ts">
  import { _ } from 'svelte-i18n';

  import queryShareApi from '@mathesar/api/rest/queryShares';
  import type { QueryInstance } from '@mathesar/api/rpc/explorations';
  import { iconShare } from '@mathesar/icons';
  import { getSharedExplorationPageUrl } from '@mathesar/routes/urls';
  import ShareEntity from '@mathesar/systems/shares/ShareEntity.svelte';
  import { Dropdown, Icon } from '@mathesar-component-library';

  export let id: QueryInstance['id'];
</script>

<Dropdown
  showArrow={false}
  triggerAppearance="secondary"
  {...$$restProps}
  ariaLabel={$_('share')}
>
  <svelte:fragment slot="trigger">
    <Icon {...iconShare} />
    <span class="responsive-button-label"> {$_('share')} </span>
  </svelte:fragment>
  <ShareEntity
    slot="content"
    entityId={id}
    api={queryShareApi}
    text={{
      header: $_('share_exploration'),
      description: $_('share_exploration_help'),
      empty: $_('exploration_not_shared'),
    }}
    getLink={(share) => getSharedExplorationPageUrl(share.slug)}
  />
</Dropdown>
