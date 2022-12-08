<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { TableEntry } from '@mathesar/api/types/tables';
  import { iconTable } from '@mathesar/icons';
  import NameWithIcon from './NameWithIcon.svelte';

  interface $$Props extends Omit<ComponentProps<NameWithIcon>, 'icon'> {
    table: Pick<TableEntry, 'name'>;
    isLoading?: boolean;
  }

  export let table: Pick<TableEntry, 'name'>;
  export let isLoading = false;
</script>

<NameWithIcon icon={iconTable} {isLoading} {...$$restProps}>
  {table.name}
</NameWithIcon>
