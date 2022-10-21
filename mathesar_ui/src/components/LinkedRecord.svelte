<script lang="ts">
  import { Chip } from '@mathesar-component-library';

  export let recordId: unknown;
  export let recordSummary: string | undefined = undefined;
</script>

<Chip class="linked-record" background="var(--color-fk)">
  {recordSummary ?? String(recordId)}
</Chip>
