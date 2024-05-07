<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { iconShare } from '@mathesar/icons';
  import type { QueryInstance } from '@mathesar/api/rest/types/queries';
  import { Dropdown, Icon } from '@mathesar-component-library';
  import ShareEntity from '@mathesar/systems/shares/ShareEntity.svelte';
  import queryShareApi from '@mathesar/api/rest/queryShares';
  import { getSharedExplorationPageUrl } from '@mathesar/routes/urls';

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
