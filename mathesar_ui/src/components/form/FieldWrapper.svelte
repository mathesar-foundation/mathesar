<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { LabeledInput } from '@mathesar-component-library';

  type Layout = ComponentProps<LabeledInput>['layout'];

  export let label: string | undefined = undefined;
  export let layout: Layout | undefined = undefined;
  export let help: string | undefined = undefined;
</script>

{#if label}
  <LabeledInput {label} {layout} {help}>
    <slot name="help" slot="help" />
    <slot />
  </LabeledInput>
{:else}
  <slot />
{/if}
