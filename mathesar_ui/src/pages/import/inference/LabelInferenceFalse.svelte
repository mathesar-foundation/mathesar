<script lang="ts">
  import { _ } from 'svelte-i18n';

  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { iconUiTypeText } from '@mathesar/icons';
</script>

<NameWithIcon icon={iconUiTypeText} truncate={false}>
  {$_('use_text_for_all_columns')}
  <em>({$_('faster_for_large_imports')})</em>
</NameWithIcon>
