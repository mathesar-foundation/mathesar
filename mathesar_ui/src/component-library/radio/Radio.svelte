<script lang="ts">
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';

  export let group: string | number | string[] | undefined = undefined;
  export let value: string | number | string[] | undefined = undefined;
  export let disabled = false;
  export let id: string = undefined;
</script>

<BaseInput {...$$restProps} bind:id {disabled} />

<input class="radio" type="radio" bind:group {value} {id} {disabled} />
