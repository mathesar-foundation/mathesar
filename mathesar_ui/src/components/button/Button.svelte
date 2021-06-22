<script lang="ts">
  let classes = '';
  export { classes as class };
  export let element: HTMLElement = null;
  export let type = 'button';
</script>

<button bind:this={element} {type}
        class={['btn', classes].join(' ')} {...$$restProps}
        on:click>
  <slot></slot>
</button>

<style global lang="scss">
  @import "Button.scss";
</style>
