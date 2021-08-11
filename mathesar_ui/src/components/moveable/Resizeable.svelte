<script lang="ts">
  import Moveable  from "svelte-moveable";
  /**
   * The HTML Element which is the movable target
   * @required
   */
  export let target : HTMLElement = null;
  let throttleResize : number = 0;

  /**
   * The cardinal directions in which the element can be resized
   */
  export let renderDirections:(boolean|string[]) & (string|boolean|string[]) = ['nw','n','ne','w','e','sw','s','se']
  export let element: HTMLElement = null;
  export let onResize;
  export let onResizeEnd;
  let zoom:number = 1;

</script>
<div bind:this={element} class="resizer-wrapper">
  <Moveable
    draggable={false}
    edge={true}
    keepRatio={false}
    onResize={onResize}
    onResizeEnd={onResizeEnd}
    renderDirections={renderDirections}
    resizable={true}
    target={target}
    throttleResize={throttleResize}
    zoom={zoom}
  />
</div>

<style global lang="scss">
  @import "Resizeable.scss";
</style>
