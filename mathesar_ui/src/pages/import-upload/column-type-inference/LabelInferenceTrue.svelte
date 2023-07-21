<script lang="ts">
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { iconInferColumnType } from '@mathesar/icons';
</script>

<NameWithIcon icon={iconInferColumnType} truncate={false}>
  Analyze data and pick the best type for each column
  <em>(slower for large imports)</em>
</NameWithIcon>
