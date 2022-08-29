<script lang="ts">
  import EntityType from '@mathesar/components/EntityType.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';

  export let recordId: number;
</script>

<LayoutWithHeader>
  <div><EntityType>Record</EntityType></div>
  <h1>Record Page {recordId}</h1>
</LayoutWithHeader>
