<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconTableLink } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { BadgeCount, Dropdown, Icon } from '@mathesar-component-library';

  import Join from './Join.svelte';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ meta } = $tabularData);
  $: joining = meta.joining;
</script>

<Dropdown
  showArrow={false}
  triggerAppearance="secondary"
  {...$$restProps}
  ariaLabel={$_('join')}
  autoReposition
>
  <svelte:fragment slot="trigger">
    <Icon {...iconTableLink} />
    <span class="responsive-button-label with-badge">
      {$_('join')}
      <BadgeCount value={$joining.simpleManyToMany.size} />
    </span>
  </svelte:fragment>
  <div slot="content" class="content">
    <Join />
  </div>
</Dropdown>

<style lang="scss">
  .with-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--sm5);
  }
  .content {
    padding: var(--sm3) var(--sm5) var(--sm1) var(--sm5);
  }
</style>
