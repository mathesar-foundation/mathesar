<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { iconTableLink } from '@mathesar/icons';
  import type { RelatedColumns } from '@mathesar/stores/table-data';
  import { BadgeCount, Dropdown, Icon } from '@mathesar-component-library';

  import RelatedColumnsContent from './RelatedColumnsContent.svelte';

  interface $$Props extends ComponentProps<Dropdown> {
    relatedColumns: Writable<RelatedColumns>;
  }

  export let relatedColumns: Writable<RelatedColumns>;
</script>

<Dropdown
  showArrow={false}
  triggerAppearance="secondary"
  {...$$restProps}
  ariaLabel={$_('related_columns')}
>
  <svelte:fragment slot="trigger">
    <Icon {...iconTableLink} />
    <span class="responsive-button-label with-badge">
      {$_('related_columns')}
      <BadgeCount value={$relatedColumns.entries.length} />
    </span>
  </svelte:fragment>
  <RelatedColumnsContent slot="content" {relatedColumns} />
</Dropdown>

<style lang="scss">
  .with-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--sm5);
  }
</style>
