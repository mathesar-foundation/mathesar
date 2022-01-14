<script lang="ts">
  import type { Option } from '@mathesar-component-library-dir/types';
  import LabeledInput from '@mathesar-component-library-dir/labeled-input/LabeledInput.svelte';

  export let isInline = false;
  export let options: Option[] = [];
  export let label: string | undefined = undefined;
</script>

<fieldset class="fieldset-group" class:inline={isInline}>
  {#if $$slots.label || label}
    <legend>
      {#if $$slots.label}<slot name="label"/>{/if}
      {#if label}{label}{/if}
    </legend>
  {/if}
  <ul class="options">
    {#each options as option (option.value)}
      <li class="option">
        <LabeledInput layout='inline-input-first'>
          <svelte:fragment slot=label>
            {#if option.label}
               {option.label}
            {:else}
              <svelte:component
                this={option.labelComponent}
                {...option.labelComponentProps}
              />
            {/if}
          </svelte:fragment>
          <slot {option}/>
        </LabeledInput>
      </li>
    {/each}
  </ul>
</fieldset>
