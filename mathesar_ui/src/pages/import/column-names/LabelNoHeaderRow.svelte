<script lang="ts">
  import { _ } from 'svelte-i18n';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { iconUseFirstRowAsData } from '@mathesar/icons';
</script>

<NameWithIcon icon={iconUseFirstRowAsData} truncate={false}>
  {$_('keep_first_row_as_data')}
</NameWithIcon>
