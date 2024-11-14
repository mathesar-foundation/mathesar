<script lang="ts">
  export let label: string | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;
  export let boxed = false;
</script>

<fieldset
  class="fieldset"
  class:boxed
  class:has-label={!!label}
  aria-label={ariaLabel}
  on:change
>
  {#if $$slots.label || label}
    <legend><slot name="label">{label}</slot></legend>
  {/if}
  <slot />
</fieldset>
