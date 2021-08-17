<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    faLock,
    faProjectDiagram,
    faTrash,
    faPencilAlt,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Button } from '@mathesar-components';
  import type { Schema } from '@mathesar/App.d';

  const dispatch = createEventDispatcher();

  // Props
  export let schema: Schema;

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
    <div class="info">
      {#if isDefault}
        <strong>Default</strong>
        &middot;
      {/if}
      {schema.tables.size} Tables
    </div>
  </div>
  {#if !isLocked}
    <div class="controls">
      <Button class="edit" on:click={() => dispatch('edit', schema)}>
        <Icon data={faPencilAlt}/>
      </Button>
      <Button class="delete">
        <Icon data={faTrash}/>
      </Button>
      <slot/>
    </div>
  {/if}
</div>

<style global lang="scss">
  @import "SchemaRow.scss";
</style>
