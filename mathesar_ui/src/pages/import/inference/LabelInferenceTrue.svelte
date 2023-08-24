<script lang="ts">
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { iconInferColumnType } from '@mathesar/icons';
</script>

<NameWithIcon icon={iconInferColumnType} truncate={false}>
  Pick the best data type for each column
  <em>(slower for large imports)</em>
</NameWithIcon>
