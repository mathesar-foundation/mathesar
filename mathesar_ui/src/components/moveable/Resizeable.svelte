<script lang="ts">
  import Moveable from 'svelte-moveable';
  /**
   * The HTML Element which is the movable target
   * @required
   */
  export let target : HTMLElement = null;

  /**
   * Callback function when resize event is triggered
   * This is wrapped in a function which sizes the target element.
   */
  export let onResize:CallableFunction = () => {};

  /**
   * Callback function when resize has ended
   */
  export let onResizeEnd:CallableFunction = () => {};
  export let keepRatio = false;
  export let padding = {
    top: 0, right: 0, bottom: 0, left: 0,
  };
  export let directions = [
    'nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se',
  ];
  export let throttle = 0;
  export let zoom = 0.5;

  function resize(event:CustomEvent) {
    target.style.width = `${<number>event.detail.width}px`;
    target.style.height = `${<number>event.detail.height}px`;
    onResize(event);
  }

  function resizeEnd(event:CustomEvent) {
    onResizeEnd(event);
  }

  export let moveable: Moveable = null;
</script>

<Moveable bind:this={moveable}
  keepRatio={keepRatio}
  on:resize={resize}
  on:resizeEnd={resizeEnd}
  origin={true}
  padding={padding}
  renderDirections={directions}
  resizable={true}
  target={target}
  throttleResize={throttle}
  zoom={zoom}
/>