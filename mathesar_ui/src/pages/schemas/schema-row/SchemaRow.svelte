<script lang="ts">
  import {
    faLock,
    faProjectDiagram,
    faTrash,
    faPencilAlt,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Button } from '@mathesar-components';
  import type { Schema } from '@mathesar/utils/preloadData';

  // Props
  export let schema: Schema;

  $: isDefault = schema.name === 'public';
  $: isLocked = schema.name === 'public';

  // Additional classes
  let classes = '';
  export { classes as class };

  // Inline styles
  export let style = '';
</script>

<div class={['schema-row', classes].join(' ')} {style}>
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
      {schema.tables.length} Tables
    </div>
  </div>
  {#if !isLocked }
    <div class="controls">
      <Button class="edit">
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
