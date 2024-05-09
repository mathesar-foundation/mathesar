<script lang="ts">
  import { _ } from 'svelte-i18n';

  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { iconInferColumnType } from '@mathesar/icons';
</script>

<NameWithIcon icon={iconInferColumnType} truncate={false}>
  {$_('pick_best_data_type_column')}
  <em>({$_('slower_for_large_imports')})</em>
</NameWithIcon>
