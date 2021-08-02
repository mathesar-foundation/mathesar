<script lang="ts">
  import {
    faLock,
    faProjectDiagram,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon } from '@mathesar-components';

  // Props
  export let schemaName = '';
  export let tableCount = 0;
  export let isDefault = true;
  export let isLocked = true;

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
      {schemaName}
      {#if isLocked}
        <Icon class="lock" data={faLock}/>
      {/if}
    </div>
    <div class="info">
      {#if isDefault}
        <strong>Default</strong>
        &middot;
      {/if}
      {tableCount} Tables
    </div>
  </div>
  <div class="controls">
    <slot/>
  </div>
</div>

<style global lang="scss">
  @import "SchemaRow";
</style>
