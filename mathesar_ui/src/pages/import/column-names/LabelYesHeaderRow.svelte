<script lang="ts">
  import { _ } from 'svelte-i18n';

  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { iconUseFirstRowAsColumnName } from '@mathesar/icons';
</script>

<NameWithIcon icon={iconUseFirstRowAsColumnName} truncate={false}>
  {$_('take_first_row_as_column_names')}
</NameWithIcon>
