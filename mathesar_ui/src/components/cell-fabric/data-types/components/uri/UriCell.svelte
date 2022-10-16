<script lang="ts">
  import { TextInput } from '@mathesar-component-library';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import SteppedInputCell from '../SteppedInputCell.svelte';
  import type { CellTypeProps } from '../typeDefinitions';

  type $$Props = CellTypeProps<string>;

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];

  let datafromdbcopyhelper = false;
  let datafromdb: string;
  function Escbehave(e: KeyboardEvent) {
    datafromdb =
      datafromdbcopyhelper === false && value !== undefined && value !== null
        ? value
        : datafromdb;
    datafromdbcopyhelper = true;
    if (e.key === 'Escape') {
      value = datafromdb;
    }
    if (e.key === 'Enter') {
      datafromdb = value !== undefined && value !== null ? value : '';
    }
  }
</script>

<SteppedInputCell
  {value}
  {isActive}
  {isSelectedInRange}
  {disabled}
  let:handleInputBlur
  let:handleInputKeydown
  on:movementKeyDown
  on:activate
  on:mouseenter
  on:update
>
  <span slot="content">
    <CellValue {value}>
      {#if isActive}
        <a href={value ?? ''} target="_blank" class="link">{value}</a>
      {:else}
        <span class="content">{value}</span>
      {/if}
    </CellValue>
  </span>
  <TextInput
    focusOnMount={true}
    {disabled}
    bind:value
    on:blur={handleInputBlur}
    on:keydown={handleInputKeydown}
    on:keydown={(e) => {
      Escbehave(e);
    }}
  />
</SteppedInputCell>

<style>
  .content {
    text-decoration: underline;
  }
  .link {
    color: #3867ad;
  }
  .link:visited {
    color: #6138ad;
  }
</style>
