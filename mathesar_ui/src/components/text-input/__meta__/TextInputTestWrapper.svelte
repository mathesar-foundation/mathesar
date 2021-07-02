<script lang="ts">
  import TextInput from '../TextInput.svelte';
</script>

<TextInput {...$$restProps}>
  <h1 slot="prepend" data-testid="prepend">Prepend</h1>
  <h1 slot="append" data-testid="append">Append</h1>
</TextInput>
