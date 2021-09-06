<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    faLock,
    faProjectDiagram,
    faTrash,
    faPencilAlt,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Button } from '@mathesar-components';
  import type { SchemaEntry } from '@mathesar/App.d';

  const dispatch = createEventDispatcher();

  // Props
  export let schema: SchemaEntry;

  $: isDefault = schema.name === 'public';
  $: isLocked = schema.name === 'public';
</script>

<div class="schema-row">
  <div class="details">
    <div class="title">
      <Icon data={faProjectDiagram}/>
      {schema.name}
      {#if isLocked}
        <Icon class="lock" data={faLock}/>
      {/if}
    </div>
    {#if isDefault}
    <div class="info">
      <strong>Default</strong>
    </div>
    {/if}
  </div>
  {#if !isLocked}
    <div class="controls">
      <Button class="edit" on:click={() => dispatch('edit', schema)}>
        <Icon data={faPencilAlt}/>
      </Button>
      <Button class="delete" on:click={() => dispatch('delete', schema)}>
        <Icon data={faTrash}/>
      </Button>
      <slot/>
    </div>
  {/if}
</div>

<style global lang="scss">
  @import "SchemaRow.scss";
</style>
