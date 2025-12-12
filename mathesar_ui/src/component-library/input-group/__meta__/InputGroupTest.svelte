<script lang="ts">
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';

  import InputGroup from '../InputGroup.svelte';
  import InputGroupText from '../InputGroupText.svelte';
</script>

<InputGroup>
  <InputGroupText data-testid="prepend">Prepended data</InputGroupText>
  <TextInput data-testid="input-1" value="value1" />
  <TextInput data-testid="input-2" value="value2" />
  <InputGroupText data-testid="append">Appended data</InputGroupText>
</InputGroup>
