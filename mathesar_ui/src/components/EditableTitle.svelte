<script lang="ts">
  import { TextInput } from '@mathesar-component-library';

  export let value = '';
  export let size = 1;

  const paddingStyle = 'padding:0.4rem';
</script>

<!--TODO: Improve accessibility-->
<div class="editable-title" style="font-size:{size}rem;">
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
      font-weight: 500;
      color: transparent;
    }
    :global(input) {
      position: absolute;
      top: 0;
      background: var(--white);
      font-weight: 500;
    }
    :global(input.text-input:not(:hover):not(:focus)) {
      border-color: transparent;
      background: transparent;
    }
  }
</style>
