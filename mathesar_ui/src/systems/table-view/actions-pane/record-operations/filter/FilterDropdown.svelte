<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import type { Writable } from 'svelte/store';

  import { Dropdown, Icon } from '@mathesar-component-library';
  import BadgeCount from '@mathesar/component-library/badge-count/BadgeCount.svelte';
  import { iconFiltering } from '@mathesar/icons';
  import type { Filtering } from '@mathesar/stores/table-data';
  import Filter from './Filter.svelte';

  interface $$Props extends ComponentProps<Dropdown> {
    filtering: Writable<Filtering>;
    showsLabel?: boolean;
  }

  export let filtering: Writable<Filtering>;
  export let showsLabel = true;
</script>

<Dropdown
  showArrow={false}
  triggerAppearance="secondary"
  {...$$restProps}
  ariaLabel="Filter"
>
  <svelte:fragment slot="trigger">
    <Icon {...iconFiltering} size="0.8em" />
    {#if showsLabel}
      <span>Filter <BadgeCount value={$filtering.entries.length} /></span>
    {/if}
  </svelte:fragment>
  <Filter slot="content" {filtering} />
</Dropdown>
