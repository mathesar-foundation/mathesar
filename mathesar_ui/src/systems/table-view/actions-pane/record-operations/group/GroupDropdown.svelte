<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import BadgeCount from '@mathesar/component-library/badge-count/BadgeCount.svelte';
  import { iconGrouping } from '@mathesar/icons';
  import type { Grouping } from '@mathesar/stores/table-data';
  import { Dropdown, Icon } from '@mathesar-component-library';

  import Group from './Group.svelte';

  interface $$Props extends ComponentProps<Dropdown> {
    grouping: Writable<Grouping>;
  }

  export let grouping: Writable<Grouping>;
</script>

<Dropdown
  showArrow={false}
  triggerAppearance="secondary"
  {...$$restProps}
  ariaLabel={$_('group')}
>
  <svelte:fragment slot="trigger">
    <Icon {...iconGrouping} />
    <span class="responsive-button-label">
      {$_('group')}
      <BadgeCount value={$grouping.entries.length} />
    </span>
  </svelte:fragment>
  <Group slot="content" {grouping} />
</Dropdown>
