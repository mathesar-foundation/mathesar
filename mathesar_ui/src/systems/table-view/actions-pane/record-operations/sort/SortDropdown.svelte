<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import type { Writable } from 'svelte/store';

  import { BadgeCount, Dropdown, Icon } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import { iconSorting } from '@mathesar/icons';
  import type { Sorting } from '@mathesar/stores/table-data';
  import Sort from './Sort.svelte';

  interface $$Props extends ComponentProps<Dropdown> {
    sorting: Writable<Sorting>;
    columns: Column[];
  }

  export let sorting: Writable<Sorting>;
  export let columns: Column[];
</script>

<Dropdown showArrow={false} triggerAppearance="secondary" {...$$restProps}>
  <svelte:fragment slot="trigger">
    <Icon {...iconSorting} />
    <span>Sort <BadgeCount value={$sorting.size} /></span>
  </svelte:fragment>
  <Sort slot="content" {columns} {sorting} />
</Dropdown>
