<script lang="ts">
  import {
    Collapsible,
    LabeledInput,
    TextInput,
    TextArea,
  } from '@mathesar-component-library';

  let name = '';
  let description = '';
</script>

<Collapsible isOpen triggerAppearance="plain">
  <span slot="header">Properties</span>
  <div slot="content" class="content">
    <LabeledInput label="Name" layout="stacked">
      <TextInput bind:value={name} aria-label="name" />
    </LabeledInput>
    <LabeledInput label="Description" layout="stacked">
      <TextArea bind:value={description} aria-label="description" />
    </LabeledInput>
  </div>
</Collapsible>

<Collapsible isOpen triggerAppearance="plain">
  <span slot="header">Actions</span>
  <div slot="content" class="content" />
</Collapsible>

<style lang="scss">
  .content {
    padding: var(--size-large);
  }
</style>
