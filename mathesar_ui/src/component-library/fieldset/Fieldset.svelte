<script lang="ts">
  export let label: string | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;
  export let boxed = false;
</script>

<fieldset class="fieldset" class:boxed aria-label={ariaLabel} on:change>
  <legend><slot name="label">{label ?? ''}</slot></legend>
  <slot />
</fieldset>
