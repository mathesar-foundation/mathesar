<script lang='ts'>
  export let orientation = 'vertical';
  export let elements;
</script>

<div class='form-element form-layout {orientation}'>
  {#each (elements || []) as element (element)}
    <slot {element}></slot>
  {/each}
</div>
