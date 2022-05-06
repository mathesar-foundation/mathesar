<script lang="ts">
  import FlatPickr from './FlatPickrWrapper.svelte';

  export let value: string;
</script>

<FlatPickr bind:value />
