<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import type { Writable } from 'svelte/store';

  import { Dropdown, Icon } from '@mathesar-component-library';
  import BadgeCount from '@mathesar/component-library/badge-count/BadgeCount.svelte';
  import { iconGrouping } from '@mathesar/icons';
  import type { Grouping } from '@mathesar/stores/table-data';
  import Group from './Group.svelte';

  interface $$Props extends ComponentProps<Dropdown> {
    grouping: Writable<Grouping>;
  }

  export let grouping: Writable<Grouping>;
</script>

<Dropdown showArrow={false} triggerAppearance="secondary" {...$$restProps}>
  <svelte:fragment slot="trigger">
    <Icon {...iconGrouping} />
    <span>Group <BadgeCount value={$grouping.entries.length} /></span>
  </svelte:fragment>
  <Group slot="content" {grouping} />
</Dropdown>
