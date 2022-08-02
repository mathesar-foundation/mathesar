<script lang="ts">
  import { TextInput } from '@mathesar-component-library';

  export let value = '';
  export let size = 1;

  const paddingStyle = 'padding:0.43rem 0.57rem;';
</script>

<!--TODO: Improve accessibility-->
<div
  class="editable-title"
  style="font-size:{size}rem;height:{size + 1.15 + 0.125}rem"
>
  <span style={paddingStyle}>{value}</span>
  <TextInput bind:value style={paddingStyle} on:input on:change />
</div>

<style lang="scss">
  .editable-title {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    min-width: 3rem;

    > span {
      position: relative;
      display: block;
      border: 1px solid transparent;
      max-width: 100%;
      white-space: pre;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    :global(input) {
      position: absolute;
      top: 0;
      background: #fff;
    }
    :global(input.text-input:not(:hover):not(:focus)) {
      border-color: transparent;
      color: transparent;
      background: transparent;
    }
  }
</style>
