<!-- @component

This component simplifies the `Checkbox` component by mapping the `checked` prop
to a boolean `value` prop. This makes it possible to use a checkbox with our
form validation system (which requires that all inputs bind to a `value` prop).
-->
<script lang="ts">
  import Checkbox from './Checkbox.svelte';

  export let value = false;
  export let disabled = false;
  export let id: string | undefined = undefined;
</script>

<Checkbox bind:checked={value} {disabled} {id} />
